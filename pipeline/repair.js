export async function repairSchema(schema, errors, callClaude) {
  const raw = await callClaude(
    `You are a schema repair engine. Fix ONLY the listed errors. Do not change anything else.
Return ONLY the corrected full schema JSON. No markdown. No explanation. JSON only.
Same structure as input:
{
  "db": { "tables": [...] },
  "api": { "endpoints": [...] },
  "ui": { "pages": [...] },
  "auth": { "roles": [...], "permissions": [...] }
}`,
    `Fix these errors: ${JSON.stringify(errors)}
In this schema: ${JSON.stringify(schema)}`
  );
  return raw;
}
