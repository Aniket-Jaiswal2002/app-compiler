export async function extractIntent(prompt, callClaude) {
  const raw = await callClaude(
    `You are an intent extraction engine for an app compiler. Extract structured intent from user prompts.
Return ONLY valid JSON with exactly these fields:
{
  "app_type": string,
  "core_features": string[],
  "user_roles": string[],
  "monetization": string or null,
  "ambiguities": string[],
  "assumptions": string[]
}
No markdown. No explanation. JSON only.`,
    `Extract intent from: "${prompt}"`
  );
  return raw;
}