// API route to call the Express brief server
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userPrompt } = await req.json()

    // Call the Express brief server running on port 3001
    const response = await fetch("http://localhost:3001/brief", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userPrompt }),
    })

    if (!response.ok) {
      throw new Error(`Brief server error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Brief API error:", error)
    return NextResponse.json({ error: "Failed to generate brief", details: error.message }, { status: 500 })
  }
}
