import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const messages = body.system
    ? [{ role: "system", content: body.system }, ...body.messages]
    : body.messages;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: body.max_tokens || 1000,
      messages: messages,
    }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}