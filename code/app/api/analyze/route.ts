// File: code/app/api/analyze/route.ts
import { analyzeArticleText } from '@/lib/rank/ai'; // Import our new function

export async function POST(req: Request) {
  try {
    const { text, people } = await req.json();

    if (!text || !people || !Array.isArray(people)) {
      return new Response('Missing "text" or "people" array in request', { status: 400 });
    }
    
    // Call the AI logic from our lib file
    const object = await analyzeArticleText(text, people);

    return Response.json(object);
  } catch (error) {
    console.error(error);
    return new Response('Error analyzing sentiment', { status: 500 });
  }
}