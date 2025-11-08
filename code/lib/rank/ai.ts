// File: code/lib/rank/ai.ts
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { generateObject } from 'ai';

// 1. Define the OpenRouter client (we will reuse this)
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: { "HTTP-Referer": "http://localhost:3000" },
});

// 2. Define the schema for a single opinion
const sentimentSchema = z.object({
  score: z.number().min(-1.0).max(1.0).describe('The sentiment score from -1.0 to 1.0.'),
  sentiment_label: z.enum(['Positive', 'Negative', 'Neutral', 'Mixed']).describe('The sentiment category.'),
  reason: z.string().describe('A brief, neutral summary explaining the sentiment, based *only* on the person\'s opinion.'),
});

// 3. Define the schema for the /api/analyze response
const analysisSchema = z.record(
  z.string().describe("The person's name"), 
  z.record(z.string().startsWith('$'), sentimentSchema) 
);

// 4. Define the schema for the /api/summarize response
const summarySchema = z.object({
  summary: z.string().describe('A one-sentence, neutral summary of the collective sentiment.'),
});

/**
 * This is the core AI "engine".
 * It analyzes one article for opinions from a list of people.
 */
export async function analyzeArticleText(text: string, people: string[]) {
  const { object } = await generateObject({
    model: openrouter('anthropic/claude-3.5-sonnet-20240620'),
    schema: analysisSchema,
    prompt: `You are an expert financial analyst. Your task is to read the following text and find *only* the opinions expressed by the people in this list: [${people.join(', ')}].

    1. Read the entire text.
    2. For each person in the list, find all stock tickers (e.g., $TSLA, $AAPL) they specifically mentioned.
    3. If you find an opinion *from one of those people* about a stock, extract their sentiment (Positive, Negative, Neutral, or Mixed), a score, and a brief summary of their reasoning.
    4. **CRITICAL:** Ignore all other opinions, tickers, and text from people *not* in the list.
    5. If a person from the list is not mentioned or has no stock opinions in this text, do not include them in the output.
    
    Return your analysis as a JSON object, with the person's name as the top-level key.
    
    Text to analyze:
    "${text}"`,
  });
  return object;
}

/**
 * This is the core "reasoning" engine.
 * It summarizes a list of reasons for a single stock.
 */
export async function summarizeReasons(ticker: string, reasons: string[]) {
  const { object } = await generateObject({
    model: openrouter('anthropic/claude-3.5-sonnet-20240620'),
    schema: summarySchema,
    prompt: `You are a financial analyst. The following is a list of individual reasons people gave for their sentiment on ${ticker}:
    
    - "${reasons.join('"\n- "')}"
    
    Please synthesize these points into a single, neutral, one-sentence summary of the *collective* opinion. For example, "Sentiment is positive, citing strong fundamentals, but some are concerned about valuation."`,
  });
  return object;
}