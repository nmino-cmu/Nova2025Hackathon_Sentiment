import { createOpenAI } from '@ai-sdk/openai'; // <-- THIS LINE CHANGED
import { z } from 'zod';
import { generateObject } from 'ai';

// 1. Configure the OpenAI client to point to OpenRouter
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: { "HTTP-Referer": "http://localhost:3000" }, // <-- This line is fixed
});

// 2. Define the inner schema for what an opinion looks like
const sentimentSchema = z.object({
  score: z.number().min(-1.0).max(1.0).describe('The sentiment score from -1.0 to 1.0.'),
  sentiment_label: z.enum(['Positive', 'Negative', 'Neutral', 'Mixed']).describe('The sentiment category.'),
  reason: z.string().describe('A brief, neutral summary explaining the sentiment, based *only* on the person\'s opinion.'),
});

// 3. Define the outer schema: an object of { "Person Name": { "$TICKER": { ... } } }
const analysisSchema = z.record(
  z.string().describe("The person's name"), 
  z.record(z.string().startsWith('$'), sentimentSchema) 
);

// 4. This is the Next.js API route handler
export async function POST(req: Request) {
  try {
    // 5. Get both the text and the list of people from the request
    const { text, people } = await req.json();

    if (!text || !people || !Array.isArray(people)) {
      return new Response('Missing "text" or "people" array in request', { status: 400 });
    }

    // 6. Call the AI using generateObject
    const { object } = await generateObject({
      model: openrouter('anthropic/claude-3.5-sonnet-20240620'),
      schema: analysisSchema, // Force the AI to return our nested JSON
      
      // 7. This is our smart prompt
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

    // 8. Send the structured JSON object back to the frontend
    return Response.json(object);

  } catch (error) {
    console.error(error);
    return new Response('Error analyzing sentiment', { status: 500 });
  }
}