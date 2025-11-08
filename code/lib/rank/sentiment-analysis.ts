// Types for sentiment analysis responses
import type { OpinionExtraction } from "./ai"

export interface AnalysisResponse {
  opinions: OpinionExtraction[]
}

export interface SentimentScore {
  bullish: number
  bearish: number
  neutral: number
}
