// Ranking and aggregation logic for stock sentiment
import type { AnalysisResponse } from "./sentiment-analysis"

export interface RankedStock {
  ticker: string
  score: number
  sentiment: string
  reasons: string[]
  rank: number
  label: string
  url?: string
  domain?: string
  reason?: string
}

export function aggregateOpinions(responses: AnalysisResponse[]): RankedStock[] {
  const stockMap = new Map<string, { bullish: number; bearish: number; neutral: number; reasons: string[] }>()

  // Aggregate all opinions
  for (const response of responses) {
    for (const opinion of response.opinions) {
      const ticker = opinion.ticker.toUpperCase()
      if (!stockMap.has(ticker)) {
        stockMap.set(ticker, { bullish: 0, bearish: 0, neutral: 0, reasons: [] })
      }
      const stock = stockMap.get(ticker)!

      if (opinion.sentiment === "bullish") stock.bullish++
      else if (opinion.sentiment === "bearish") stock.bearish++
      else stock.neutral++

      stock.reasons.push(`${opinion.person}: ${opinion.reasoning}`)
    }
  }

  // Calculate scores and rank
  const ranked: RankedStock[] = []
  for (const [ticker, data] of stockMap.entries()) {
    const score = data.bullish * 10 - data.bearish * 5 + data.neutral * 2
    const totalOpinions = data.bullish + data.bearish + data.neutral
    const sentiment = data.bullish > data.bearish ? "bullish" : data.bearish > data.bullish ? "bearish" : "neutral"

    ranked.push({
      ticker,
      score,
      sentiment,
      reasons: data.reasons,
      rank: 0, // Will be set after sorting
      label: ticker,
    })
  }

  // Sort by score descending and assign ranks
  ranked.sort((a, b) => b.score - a.score)
  ranked.forEach((stock, index) => {
    stock.rank = index + 1
  })

  return ranked
}
