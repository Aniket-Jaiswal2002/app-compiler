export async function generateSchema(intent, architecture, callClaude) {
  const raw = await callClaude(
    `You are a schema generation engine. Produce complete DB, API, UI, and Auth schemas.
Return ONLY valid JSON with exactly this structure:
{
  "db": {
    "tables": [{ "name": string, "columns": [{ "name": string, "type": string, "primary_key": boolean }] }]
  },
  "api": {
    "endpoints": [{ "method": string, "path": string, "entity": string, "auth_required": boolean }]
  },
  "ui": {
    "pages": [{ "name": string, "components": string[], "access_roles": string[] }]
  },
  "auth": {
    "roles": string[],
    "permissions": string[]
  }
}
Rules:
- Every API endpoint entity MUST match a DB table name
- Every UI page access_role MUST exist in auth.roles
- Every table MUST have a primary key column
No markdown. No explanation. JSON only.`,
    `Generate schemas for: Intent=${JSON.stringify(intent)} Architecture=${JSON.stringify(architecture)}`
  );
  return raw;
}