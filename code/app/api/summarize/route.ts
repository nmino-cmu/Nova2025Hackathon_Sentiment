import { createOpenAI } from '@ai-sdk/openai'; // <-- THIS LINE CHANGED
import { z } from 'zod';
import { generateObject } from 'ai';

// 1. Re-use the same OpenRouter client
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: { "HTTP-Referer": "http://localhost:3000" }, // <-- This line is fixed
});

// 2. Define the exact JSON structure we want back
const summarySchema = z.object({
  summary: z.string().describe('A one-sentence, neutral summary of the collective sentiment.'),
});

// 3. The API route handler
export async function POST(req: Request) {
  try {
    // Get the stock ticker and the list of reasons from the request
    const { ticker, reasons } = await req.json();

    if (!ticker || !reasons || !Array.isArray(reasons)) {
      return new Response('Missing "ticker" or "reasons" array', { status: 400 });
    }

    // 4. Call the AI using generateObject
    const { object } = await generateObject({
      model: openrouter('anthropic/claude-3.5-sonnet-20240620'),
      schema: summarySchema,
      
      // 5. This is our "summary" prompt
      prompt: `You are a financial analyst. The following is a list of individual reasons people gave for their sentiment on ${ticker}:
      
      - "${reasons.join('"\n- "')}"
      
      Please synthesize these points into a single, neutral, one-sentence summary of the *collective* opinion. For example, "Sentiment is positive, citing strong fundamentals, but some are concerned about valuation."`,
    });

    // 6. Send the summary back
    return Response.json(object);

  } catch (error) {
    console.error(error);
    return new Response('Error summarizing reasons', { status: 500 });
  }
}