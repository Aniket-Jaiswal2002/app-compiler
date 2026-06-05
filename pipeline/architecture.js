export async function designArchitecture(intent, callClaude) {
  const raw = await callClaude(
    `You are a system architecture designer. Given extracted intent, produce an app architecture.
Return ONLY valid JSON with exactly these fields:
{
  "entities": string[],
  "flows": string[],
  "integrations": string[],
  "auth_strategy": string,
  "complexity": "simple" | "medium" | "complex"
}
No markdown. No explanation. JSON only.`,
    `Design architecture for this intent: ${JSON.stringify(intent)}`
  );
  return raw;
}