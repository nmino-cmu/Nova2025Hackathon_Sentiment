import type { BriefEvent, BriefResult } from "./server"; // or copy the types if your TS config dislikes this import

// These env vars are already loaded by server.ts via dotenv, so we just read them.
const RETELL_API_KEY = process.env.RETELL_API_KEY!;
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID!;

if (!RETELL_API_KEY) {
  console.warn("⚠️ RETELL_API_KEY is not set – Retell calls will fail");
}
if (!RETELL_AGENT_ID) {
  console.warn("⚠️ RETELL_AGENT_ID is not set – Retell calls will fail");
}

/**
 * Start a Retell web call that uses the brief text.
 * Returns call_id + access_token for the frontend to join via Retell Web SDK.
 */
export async function startRetellCallForBrief(
  brief: BriefResult
): Promise<{ call_id: string; access_token: string; agent_id: string }> {
  if (!RETELL_API_KEY || !RETELL_AGENT_ID) {
    throw new Error("Retell API key or agent id not configured");
  }

  const res = await fetch("https://api.retellai.com/v2/create-web-call", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RETELL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: RETELL_AGENT_ID,
      // Expose the brief text to the agent as a dynamic variable
      retell_llm_dynamic_variables: {
        daily_brief: brief.text,
      },
      metadata: {
        brief_first_event: brief.events[0]?.title ?? null,
        brief_links: brief.links,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Retell create-web-call error ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as any;

  return {
    call_id: json.call_id as string,
    access_token: json.access_token as string,
    agent_id: json.agent_id as string,
  };
}

// Re-export types so server.ts can import them from here if you prefer
export type { BriefEvent, BriefResult };
