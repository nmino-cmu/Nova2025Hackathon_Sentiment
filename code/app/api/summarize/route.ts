// File: code/app/api/summarize/route.ts
import { summarizeReasons } from '@/lib/rank/ai'; // Import our new function

export async function POST(req: Request) {
  try {
    const { ticker, reasons } = await req.json();

    if (!ticker || !reasons || !Array.isArray(reasons)) {
      return new Response('Missing "ticker" or "reasons" array', { status: 400 });
    }
    
    // Call the AI logic from our lib file
    const object = await summarizeReasons(ticker, reasons);

    return Response.json(object);
  } catch (error) {
    console.error(error);
    return new Response('Error summarizing reasons', { status: 500 });
  }
}