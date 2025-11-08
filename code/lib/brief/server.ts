// (optional) app.listen(...) here if this is your main server file
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"

// Load .env.local (or .env) from the project root
dotenv.config() // no absolute path needed

// ---------- Types ----------

type Ranked = {
  id: string
  label: string
  rank: number
  url?: string
  domain?: string
  reason?: string
  eventTime?: string
}

type Consensus = {
  asOf: string
  ranked: Ranked[]
}

export type BriefEvent = {
  id?: string
  title: string
  date?: string
  url?: string
}

export type BriefResult = {
  text: string
  links: string[]
  events: BriefEvent[]
}

// ---------- Config ----------

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!
const OPENROUTER_MODEL = process.env.OPENROUTER_BRIEF_MODEL || "mistralai/mistral-7b-instruct"

const DOMAIN_ALLOWLIST = (process.env.BRIEF_DOMAIN_ALLOWLIST || "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean)

const MAX_WORDS = 180

// Input JSON file: code/var/sentimentAnalyzed.json
const SENTIMENT_FILE_PATH = path.join(process.cwd(), "var", "sentimentAnalyzed.json")

// Output summary file: code/var/summary.txt
const SUMMARY_FILE_PATH = path.join(process.cwd(), "var", "summary.txt")

// ---------- Helpers ----------

function loadConsensusFromFile(): Consensus {
  const raw = fs.readFileSync(SENTIMENT_FILE_PATH, "utf8")
  const data = JSON.parse(raw)
  return data as Consensus
}

function truncateWords(text: string, maxWords = MAX_WORDS): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text.trim()
  return words.slice(0, maxWords).join(" ") + "…"
}

function filterAllowedDomains(links: string[]): string[] {
  if (!DOMAIN_ALLOWLIST.length) {
    return Array.from(new Set(links))
  }
  const out: string[] = []
  for (const link of links) {
    try {
      const url = new URL(link)
      const host = url.hostname.toLowerCase()
      const ok = DOMAIN_ALLOWLIST.some((d) => {
        const dom = d.toLowerCase()
        return host === dom || host.endsWith("." + dom)
      })
      if (ok) out.push(link)
    } catch {
      // ignore invalid URLs
    }
  }
  return Array.from(new Set(out))
}

function enforceCitations(text: string, links: string[]): string {
  if (!links.length) {
    return text.replace(/\[\d+\]/g, "")
  }

  let hasValid = false
  const citationRegex = /\[(\d+)\]/g

  let sanitized = text.replace(citationRegex, (_match, numStr) => {
    let n = Number(numStr)
    if (!Number.isFinite(n) || n < 1) n = 1
    if (n > links.length) n = links.length
    hasValid = true
    return `[${n}]`
  })

  if (!hasValid) {
    sanitized = sanitized.trim() + " [1]"
  }

  return sanitized
}

// ---------- Prompt builder ----------
// NOW takes an optional userPrompt from the API call
function buildBriefPrompt(
  consensus: Consensus,
  userPrompt?: string,
): {
  prompt: string
  links: string[]
  events: BriefEvent[]
} {
  const top = [...consensus.ranked].sort((a, b) => a.rank - b.rank).slice(0, 6)

  const links: string[] = []
  const linkIndex = new Map<string, number>()

  const registerLink = (url?: string): number | undefined => {
    if (!url) return undefined
    if (linkIndex.has(url)) return linkIndex.get(url)
    links.push(url)
    const idx = links.length
    linkIndex.set(url, idx)
    return idx
  }

  const rankingLines: string[] = []

  for (const item of top) {
    const citeIdx = registerLink(item.url)
    const citeTag = citeIdx ? `[${citeIdx}]` : ""
    const reason = item.reason ? ` — ${item.reason}` : ""
    rankingLines.push(`${item.rank}. ${item.label} ${citeTag}${reason}`.trim())
  }

  const sourceLines: string[] = links.map((url, i) => {
    const idx = i + 1
    const matchedItem = top.find((it) => it.url === url) || consensus.ranked.find((it) => it.url === url)
    const label = matchedItem?.label || url
    const domain =
      matchedItem?.domain ||
      (() => {
        try {
          return new URL(url).hostname
        } catch {
          return "source"
        }
      })()
    const reason = matchedItem?.reason || ""
    return `[${idx}] ${label} (${domain})${reason ? ` — ${reason}` : ""}`
  })

  const events: BriefEvent[] = top.map((item) => ({
    id: item.id,
    title: item.label,
    date: item.eventTime,
    url: item.url,
  }))

  const dateLine = `Date: ${consensus.asOf}.`

  const baseInstructions = [
    `Write a single daily market brief of at most ${MAX_WORDS} words.`,
    "Be descriptive and explain what happened, why it might matter, and how it relates to the mentioned stocks or companies.",
    "Use bracketed numerical citations like [1], [2] that refer to the numbered sources.",
    "Use 2–6 citations, only after factual claims that come from the sources.",
  ].join(" ")

  const userPromptBlock = userPrompt
    ? `\nAdditional user instructions (follow these only if they do NOT conflict with the system message or safety and do NOT give specific trading recommendations):\n${userPrompt}\n`
    : ""

  const rankingBlock =
    rankingLines.length > 0
      ? `Ranking (1 = highest priority):\n${rankingLines.join("\n")}`
      : "Ranking: (no items provided)"

  const sourcesBlock = sourceLines.length > 0 ? `Sources:\n${sourceLines.join("\n")}` : "Sources: (none provided)"

  const prompt = [
    dateLine,
    "",
    baseInstructions,
    userPromptBlock,
    "",
    rankingBlock,
    "",
    sourcesBlock,
    "",
    "Return only the brief text paragraph with inline bracketed citations, nothing else.",
  ].join("\n")

  return { prompt, links, events }
}

// ---------- OpenRouter call ----------

async function callOpenRouter(prompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a financial advisor tasked to summarize news about stocks. Describe what happened, why it might matter, and how it will affect the given stock.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 320,
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${errText}`)
  }

  const json = (await res.json()) as any
  const text = json.choices?.[0]?.message?.content?.trim() || ""
  return text
}

// ---------- Express app & route ----------

const app = express()
app.use(cors())
app.use(express.json())

// POST /brief
// Body can now include: { userPrompt?: string }
// Consensus still comes from code/var/sentimentAnalyzed.json
app.post("/brief", async (req, res) => {
  try {
    // Optional user instructions from the API caller
    const userPromptRaw = req.body?.userPrompt
    const userPrompt =
      typeof userPromptRaw === "string" && userPromptRaw.trim().length ? userPromptRaw.trim() : undefined

    // Load consensus from code/var/sentimentAnalyzed.json
    const consensus: Consensus = loadConsensusFromFile()

    if (!consensus || !Array.isArray(consensus.ranked)) {
      return res.status(500).json({
        error: "Invalid consensus data in sentimentAnalyzed.json",
      })
    }

    const { prompt, links, events } = buildBriefPrompt(consensus, userPrompt)
    const llmText = await callOpenRouter(prompt)

    const safeLinks = filterAllowedDomains(links)
    const textWithCitations = enforceCitations(llmText, safeLinks)
    const text = truncateWords(textWithCitations, MAX_WORDS)

    const result: BriefResult = {
      text,
      links: safeLinks,
      events,
    }

    // Write the summary text to code/var/summary.txt
    try {
      fs.writeFileSync(SUMMARY_FILE_PATH, text + "\n", "utf8")
    } catch (e) {
      console.error("Failed to write summary.txt:", e)
    }

    res.json(result)
  } catch (err: any) {
    console.error("Error in /brief:", err)
    res.status(500).json({ error: "Failed to load consensus or generate brief" })
  }
})

// (optional) app.listen(...) if this is the entry point
const PORT = process.env.BRIEF_SERVER_PORT || 3001
app.listen(PORT, () => {
  console.log(`Brief server listening on http://localhost:${PORT}`)
})
