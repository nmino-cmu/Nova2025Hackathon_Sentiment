import express from "express";
import cors from "cors";

import dotenv from "dotenv";

dotenv.config({
  path: "/home/sportsman/coding/javascript/Nova2025Hackathon_Sentiment/env.local.download",
});


type Ranked = {
  id: string;
  label: string;
  rank: number;
  url?: string;
  domain?: string;
  reason?: string;
  eventTime?: string;
};

type Consensus = {
  asOf: string;
  ranked: Ranked[]
};

type BriefEvent = {
  id?: string;
  title: string;
  date?: string;
  url?: string;
};

type BriefResult = {
  text: string;
  links: string[];
  events: BriefEvent[];
};

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_BRIEF_MODEL || "mistralai/mistral-7b-instruct";

const DOMAIN_ALLOWLIST = (process.env.BRIEF_DOMAIN_ALLOWLIST || "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

const MAX_WORDS = 180;

function truncateWords(text: string, maxWords = MAX_WORDS): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ") + "…";
}

function filterAllowedDomains(links: string[]): string[] {
  if (!DOMAIN_ALLOWLIST.length) {
    return Array.from(new Set(links));
  }
  const out: string[] = [];
  for (const link of links) {
    try {
      const url = new URL(link);
      const host = url.hostname.toLowerCase();
      const ok = DOMAIN_ALLOWLIST.some((d) => {
        const dom = d.toLowerCase();
        return host === dom || host.endsWith("." + dom);
      });
      if (ok) out.push(link);
    } catch {}
  }
  return Array.from(new Set(out));
}

function enforceCitations(text: string, links: string[]): string {
  if (!links.length) {
    return text.replace(/\[\d+\]/g, "");
  }

  let hasValid = false;
  const citationRegex = /\[(\d+)\]/g;

  let sanitized = text.replace(citationRegex, (_match, numStr) => {
    let n = Number(numStr);
    if (!Number.isFinite(n) || n < 1) n = 1;
    if (n > links.length) n = links.length;
    hasValid = true;
    return `[${n}]`;
  });

  if (!hasValid) {
    sanitized = sanitized.trim() + " [1]";
  }

  return sanitized;
}

function buildBriefPrompt(consensus: Consensus): {
  prompt: string;
  links: string[];
  events: BriefEvent[];
} {
  const top = [...consensus.ranked]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 6);

  const links: string[] = [];
  const linkIndex = new Map<string, number>();

  const registerLink = (url?: string): number | undefined => {
    if (!url) return undefined;
    if (linkIndex.has(url)) return linkIndex.get(url);
    links.push(url);
    const idx = links.length;
    linkIndex.set(url, idx);
    return idx;
  };

  const rankingLines: string[] = [];

  for (const item of top) {
    const citeIdx = registerLink(item.url);
    const citeTag = citeIdx ? `[${citeIdx}]` : "";
    const reason = item.reason ? ` — ${item.reason}` : "";
    rankingLines.push(`${item.rank}. ${item.label} ${citeTag}${reason}`.trim());
  }

  const sourceLines: string[] = links.map((url, i) => {
    const idx = i + 1;
    const matchedItem =
      top.find((it) => it.url === url) ||
      consensus.ranked.find((it) => it.url === url);
    const label = matchedItem?.label || url;
    const domain =
      matchedItem?.domain ||
      (() => {
        try {
          return new URL(url).hostname;
        } catch {
          return "source";
        }
      })();
    const reason = matchedItem?.reason || "";
    return `[${idx}] ${label} (${domain})${reason ? ` — ${reason}` : ""}`;
  });

  const events: BriefEvent[] = top.map((item) => ({
    id: item.id,
    title: item.label,
    date: item.eventTime,
    url: item.url,
  }));

  const dateLine = `Date: ${consensus.asOf}.`;

  const instructions = [
    `Write a single daily market brief of at most ${MAX_WORDS} words.`,
    "Be descriptive and explain what happened, why it might matter, and how it affects the given stock.",
    "Use bracketed numerical citations like [1], [2] that refer to the numbered sources.",
    "Use 2–6 citations, only after factual claims that come from the sources.",
  ].join(" ");

  const rankingBlock =
    rankingLines.length > 0
      ? `Ranking (1 = highest priority):\n${rankingLines.join("\n")}`
      : "Ranking: (no items provided)";

  const sourcesBlock =
    sourceLines.length > 0
      ? `Sources:\n${sourceLines.join("\n")}`
      : "Sources: (none provided)";

  const prompt = [
    dateLine,
    "",
    instructions,
    "",
    rankingBlock,
    "",
    sourcesBlock,
    "",
    "Return only the brief text paragraph with inline bracketed citations, nothing else.",
  ].join("\n");

  return { prompt, links, events };
}

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
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as any;
  const text = json.choices?.[0]?.message?.content?.trim() || "";
  return text;
}

const app = express();
app.use(cors());
app.use(express.json());

app.post("/brief", async (req, res) => {
  try {
    const consensus: Consensus = req.body.consensus || req.body;

    if (!consensus || !Array.isArray(consensus.ranked)) {
      return res.status(400).json({
        error: "Invalid payload: expected { asOf: string, ranked: Ranked[] }",
      });
    }

    const { prompt, links, events } = buildBriefPrompt(consensus);
    const llmText = await callOpenRouter(prompt);

    const safeLinks = filterAllowedDomains(links);
    const textWithCitations = enforceCitations(llmText, safeLinks);
    const text = truncateWords(textWithCitations, MAX_WORDS);

    const result: BriefResult = {
      text,
      links: safeLinks,
      events,
    };

    res.json(result);
  } catch (err: any) {
    console.error("Error in /brief:", err);
    res.status(500).json({ error: "Failed to generate brief" });
  }
});

// /read stays same as the cleaned version I showed above

