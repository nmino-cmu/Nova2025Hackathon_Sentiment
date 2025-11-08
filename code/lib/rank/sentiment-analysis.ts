// This schema must match the one in your API route
export interface AiSentimentResult {
  score: number;
  sentiment_label: 'Positive' | 'Negative' | 'Neutral' | 'Mixed';
  reason: string;
}

// This is the expected shape of the API response
export type AnalysisResponse = {
  [personName: string]: {
    [ticker: string]: AiSentimentResult;
  };
};

/**
 * Analyzes a piece of text for stock sentiment from specific people.
 * @param text The article text to analyze
 * @param people A list of names to search for (e.g., ["Jim", "Jane"])
 * @returns A promise that resolves to the analysis object
 */
export async function analyzeSentimentWithAI(
  text: string,
  people: string[]
): Promise<AnalysisResponse> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send both the text and the people list
      body: JSON.stringify({ text: text, people: people }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data: AnalysisResponse = await response.json();
    return data;

  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return {};
  }
}