// File: code/app/api/run-full-analysis/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Import all our helper functions
import { analyzeArticleText, summarizeReasons } from '@/lib/rank/ai';
import { aggregateOpinions, type RankedStock } from '@/lib/rank/ranking-logic'; // Assuming this is at 'lib/rank/ranking.ts'
import type { AnalysisResponse } from '@/lib/rank/sentiment-analysis'; // Assuming this is at 'lib/rank/sentiment.ts'

// --- Define File Paths ---

// Input: Your agentFindings.json file
// We use path.join to get the correct path to the 'var' folder
const INPUT_FILE_PATH = path.join(process.cwd(), 'var', 'agentFindings.json');

// Output: Your sentimentAnalyzed.json file
// We write this to the 'public' folder so the frontend can easily read it
const OUTPUT_FILE_PATH = path.join(process.cwd(), 'public', 'sentimentAnalyzed.json');

// This API route is triggered by the user
export async function POST(req: Request) {
  try {
    // 1. Get the list of people to analyze from the user
    const { people } = await req.json(); // e.g., { "people": ["Jim Cramer", "Jane Lee"] }
    if (!people || !Array.isArray(people)) {
      return new Response('Missing "people" array in request', { status: 400 });
    }

    // 2. Read the INPUT file (agentFindings.json)
    const fileContents = await fs.readFile(INPUT_FILE_PATH, 'utf8');
    // We assume agentFindings is an array of objects with a "text" field
    const sources: { text: string }[] = JSON.parse(fileContents); 

    // 3. Analyze all sources in parallel
    console.log(`Analyzing ${sources.length} sources for opinions from: ${people.join(', ')}`);
    const allApiResponses = await Promise.all(
      sources.map(source => analyzeArticleText(source.text, people))
    );
    console.log("Analysis complete. Aggregating results...");

    // 4. Run the local ranking and aggregation math
    let rankedList: RankedStock[] = aggregateOpinions(allApiResponses as AnalysisResponse[]);

    // 5. Get the "collective reason" for each stock (in parallel)
    const finalRankedList = await Promise.all(
      rankedList.map(async (stock) => {
        try {
          const { summary } = await summarizeReasons(stock.ticker, stock.reasons);
          return { ...stock, collectiveReason: summary };
        } catch (e) {
          console.error(`Failed to summarize ${stock.ticker}`, e);
          return { ...stock, collectiveReason: "Error generating summary." };
        }
      })
    );
    console.log("Summaries complete. Writing to output file...");

    // 6. Write the final data to the OUTPUT file
    await fs.writeFile(OUTPUT_FILE_PATH, JSON.stringify(finalRankedList, null, 2));
    
    console.log("Successfully wrote to sentimentAnalyzed.json");

    // 7. Send success back to the frontend
    return NextResponse.json({
      success: true,
      message: `Analysis complete. ${finalRankedList.length} stocks ranked.`,
      outputFile: '/sentimentAnalyzed.json' // Tell the frontend where to find the file
    });

  } catch (error: any) {
    console.error("Full analysis failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}