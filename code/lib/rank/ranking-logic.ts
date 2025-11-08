// This file (code/lib/ranking-logic.ts) will handle all the
// frontend math for aggregating and ranking stocks.

import type { AnalysisResponse, AiSentimentResult } from './sentiment-analysis'

// 1. Define the final shape of our ranked stock list
export interface RankedStock {
  ticker: string;
  rankingScore: number;     // The final score we sort by
  averageSentiment: number; // The avg score from -1.0 to 1.0
  mentionCount: number;     // How many people mentioned it
  people: string[];         // List of people who mentioned it
  reasons: string[];        // List of all individual reasons
  collectiveReason?: string; // The final AI-generated summary
}

// This is the intermediate structure we'll use for calculations
type AggregationMap = {
  [ticker: string]: {
    scores: number[];
    reasons: string[];
    people: Set<string>; // Use a Set to avoid duplicate names
  };
};

/**
 * Takes all the raw API responses and aggregates them by stock ticker.
 * This is the core of our "collective" math.
 */
export function aggregateOpinions(
  apiResponses: AnalysisResponse[]
): RankedStock[] {
  const stockMap: AggregationMap = {};

  // Step 1: Loop through all API responses and populate the stockMap
  for (const response of apiResponses) {
    // response = { "Jim Cramer": { "$AAPL": { ... } } }
    for (const person in response) {
      const opinions = response[person];
      // opinions = { "$AAPL": { ... }, "$TSLA": { ... } }
      for (const ticker in opinions) {
        const opinion = opinions[ticker];

        // If this is the first time we see this stock, initialize it
        if (!stockMap[ticker]) {
          stockMap[ticker] = {
            scores: [],
            reasons: [],
            people: new Set(),
          };
        }

        // Add this opinion's data to the aggregation
        stockMap[ticker].scores.push(opinion.score);
        stockMap[ticker].reasons.push(opinion.reason);
        stockMap[ticker].people.add(person);
      }
    }
  }

  // Step 2: Convert the map into our final RankedStock list
  const rankedList: RankedStock[] = [];
  for (const ticker in stockMap) {
    const data = stockMap[ticker];
    const mentionCount = data.scores.length;

    // Calculate the average sentiment
    const sum = data.scores.reduce((a, b) => a + b, 0);
    const averageSentiment = sum / mentionCount;

    // Calculate our final "Ranking Score"
    // This formula (avg * count) matches your logic:
    // "mentioned the most... with the highest score"
    const rankingScore = averageSentiment * mentionCount;

    rankedList.push({
      ticker: ticker,
      rankingScore: rankingScore,
      averageSentiment: averageSentiment,
      mentionCount: mentionCount,
      people: Array.from(data.people),
      reasons: data.reasons,
    });
  }

  // Step 3: Sort the list by our new rankingScore, descending
  return rankedList.sort((a, b) => b.rankingScore - a.rankingScore);
}