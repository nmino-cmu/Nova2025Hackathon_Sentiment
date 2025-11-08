// AI functions for sentiment analysis using OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ""
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet"

export interface OpinionExtraction {
  person: string
  ticker: string
  sentiment: "bullish" | "bearish" | "neutral"
  reasoning: string
}

export async function analyzeArticleText(text: string, people: string[]): Promise<{ opinions: OpinionExtraction[] }> {
  if (!OPENROUTER_API_KEY) {
    console.warn("OPENROUTER_API_KEY not set, returning mock data")
    return {
      opinions: [
        {
          person: people[0] || "Unknown",
          ticker: "AAPL",
          sentiment: "bullish",
          reasoning: "Positive outlook on tech sector",
        },
      ],
    }
  }

  const prompt = `Analyze the following text and extract stock opinions from these people: ${people.join(", ")}.

Text: ${text}

For each person mentioned, identify:
1. Which stock ticker they're discussing (use standard ticker symbols)
2. Their sentiment (bullish, bearish, or neutral)
3. Their reasoning

Return a JSON array of objects with: person, ticker, sentiment, reasoning`

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
          content: "You are a financial analyst extracting stock opinions from text. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    throw new Error(`OpenRouter error ${res.status}`)
  }

  const json = await res.json()
  const content = json.choices?.[0]?.message?.content?.trim() || "{}"

  try {
    const parsed = JSON.parse(content)
    return { opinions: Array.isArray(parsed) ? parsed : parsed.opinions || [] }
  } catch (e) {
    console.error("Failed to parse AI response:", content)
    return { opinions: [] }
  }
}

export async function summarizeReasons(ticker: string, reasons: string[]): Promise<{ summary: string }> {
  if (!OPENROUTER_API_KEY) {
    return { summary: reasons.join(" ") }
  }

  const prompt = `Summarize these opinions about ${ticker} into one concise sentence:\n${reasons.join("\n")}`

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.5,
    }),
  })

  if (!res.ok) {
    throw new Error(`OpenRouter error ${res.status}`)
  }

  const json = await res.json()
  const summary = json.choices?.[0]?.message?.content?.trim() || reasons[0] || ""

  return { summary }
}
