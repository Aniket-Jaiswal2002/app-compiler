"use client"
import { useState } from "react"
export default function Home() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [output,setOutput] = useState(null);
    const [stage, setStage] = useState("");
    const [intent, setIntent] = useState(null);
    const [architecture, setArchitecture] = useState(null);
    const [schema, setSchema] = useState(null);
    const [validation, setValidation] = useState<any>(null);
    const [error,setError] = useState("");
    
function safeParseJSON(text: string): any | null {
  try {
    const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    return null;
  }
}
    
function validateSchemas(schema: any) {
  const errors: string[] = [];
  const checks: { pass: boolean; msg: string }[] = [];

  const dbTables = schema.db.tables.map((t: any) => t.name.toLowerCase());
  schema.api.endpoints.forEach((ep: any) => {
    if (ep.entity) {
      const found = dbTables.some((t: any) => t.includes(ep.entity.toLowerCase()));
      if (found) {
        checks.push({ pass: true, msg: `API /${ep.path} → DB table found` });
      } else {
        errors.push(`API endpoint /${ep.path} references "${ep.entity}" but no matching DB table`);
        checks.push({ pass: false, msg: `API /${ep.path} → no DB table for "${ep.entity}"` });
      }
    }
  });

  const authRoles = schema.auth.roles.map((r: any) => r.toLowerCase());
  schema.ui.pages.forEach((page: any) => {
    if (page.access_roles) {
      page.access_roles.forEach((role: any) => {
        if (authRoles.includes(role.toLowerCase())) {
          checks.push({ pass: true, msg: `UI "${page.name}" → role "${role}" verified` });
        } else {
          errors.push(`UI page "${page.name}" uses role "${role}" not defined in auth`);
          checks.push({ pass: false, msg: `UI "${page.name}" → role "${role}" undefined` });
        }
      });
    }
  });

  return { errors, checks, passed: errors.length === 0 };
}

async function runPipeline() {
  setLoading(true);
  setIntent(null);
  setArchitecture(null);
  setSchema(null);
  setValidation(null);
  setOutput(null);
  setError("");

  try {
    // Stage 1 - Intent Extraction
    setStage("Extracting intent...");
    const intentRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 4000,
        system: `You are an intent extraction engine. Extract structured intent from user prompts.
Respond ONLY with valid JSON, no markdown, no explanation.
Return this exact structure:
{
  "entities": ["string"],
  "roles": ["string"],
  "features": ["string"],
  "auth_required": boolean,
  "payment_required": boolean,
  "ambiguities": ["string"],
  "assumptions": ["string"]
}`,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const intentData = await intentRes.json();
    const intentText = intentData.choices[0]?.message?.content;
    if (!intentText) {
      setError(intentData.error?.message || "No response from AI. Please try again.");
      setLoading(false);
      setStage("");
      return;
    }
    const intentParsed = safeParseJSON(intentText);
    if (!intentParsed) {
      setError("Failed to extract intent. Please try again.");
      setLoading(false);
      setStage("");
      return;
    }
    setIntent(intentParsed);

    //Stage 2 - Architecture Design 

    setStage("Designing architecture...");
    const archRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 4000,
        system: `You are an architecture designer. Respond ONLY with valid JSON, no markdown.
Return this exact structure:
{
  "entity_relationships": [{"from": "string", "to": "string", "type": "string"}],
  "feaature_components": [{"feature": "string", "components": ["string"]}],
  "tech-stack": {"frontend": "string", "backend": "string", "database": "string", "auth": "string"}
}`,
        messages: [{ role: "user", content: `Design architecture for this intent: ${JSON.stringify(intentParsed)}` }],
      }),
    });
    const archData = await archRes.json();
    const archText = archData.choices[0]?.message?.content;
    if (!archText) {
      setError(archData.error?.message || "No response from AI. Please try again.");
      setLoading(false);
      setStage("");
      return;
    }
    const archParsed = safeParseJSON(archText);
    if (!archParsed) {
      setError("Failed to design architecture. Please try again.");
      setLoading(false);
      setStage("");
      return;
    }
    setArchitecture(archParsed);  
    
    // Stage 3 - Schema Generation
    setStage("Generating schemas...");
    const schemaRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 4000,
        system: `You are a schema generation engine. Produce DB, API, UI, and Auth schemas.
        Be concise - maximum 6 tables, 8 endpoints, 6 pages.
Respond ONLY with valid JSON, no markdown.
Return this exact structure:
{
  "db": {
    "tables": [{"name": "string", "columns": [{"name": "string", "type": "string", "primary_key": boolean}]}]
  },
  "api": {
    "endpoints": [{"path": "string", "method": "string", "auth_required": boolean, "entity": "string"}]
  },
  "ui": {
    "pages": [{"name": "string", "route": "string", "access_roles": ["string"]}]
  },
  "auth": {
    "strategy": "string",
    "roles": ["string"],
    "permissions": ["string"]
  }
}`,
        messages: [{ role: "user", content: `Generate schemas. Intent: ${JSON.stringify(intentParsed)} Architecture: ${JSON.stringify(archParsed)}` }],
      }),
    });    
    const schemaData = await schemaRes.json();
    const schemaText = schemaData.choices[0]?.message?.content;
    if (!schemaText) {
      setError(schemaData.error?.message || "No response from AI. Please try again.");
      setLoading(false);
      setStage("");
      return;
    }
    const schemaParsed = safeParseJSON(schemaText);
    if (!schemaParsed) {
       setError("Prompt too complex. Try a simpler description.");
       setLoading(false);
       setStage("");
       return;
    }
    console.log("schemaParsed value:", schemaParsed);
    setSchema(schemaParsed);

    // Stage 4 - Validation
    setStage("Validating schemas...");
    const errors: string[] = [];
    const checks: { pass: boolean; msg: string }[] = [];

    // Check 1: API entities exist in DB tables
    const dbTables = schemaParsed.db.tables.map((t:any) => t.name.toLowerCase());
    schemaParsed.api.endpoints.forEach((ep:any) => {
      if (ep.entity) {
        const found = dbTables.some((t:any) => t.includes(ep.entity.toLowerCase()));
        if (found) {
          checks.push({ pass: true, msg: `API /${ep.path} → DB table found` });
        } else {
          errors.push(`API endpoint /${ep.path} references "${ep.entity}" but no matching DB table`);
          checks.push({ pass: false, msg: `API /${ep.path} → no DB table for "${ep.entity}"` });
        }
      }
    });

    // Check 2: UI roles exist in auth roles
    const authRoles = schemaParsed.auth.roles.map((r:any) => r.toLowerCase());
    schemaParsed.ui.pages.forEach((page:any) => {
      if (page.access_roles) {
        page.access_roles.forEach((role:any) => {
          if (authRoles.includes(role.toLowerCase())) {
            checks.push({ pass: true, msg: `UI "${page.name}" → role "${role}" verified` });
          } else {
            errors.push(`UI page "${page.name}" uses role "${role}" not defined in auth`);
            checks.push({ pass: false, msg: `UI "${page.name}" → role "${role}" undefined` });
          }
        });
      }
    });

    const validationResult = { errors, checks, passed: errors.length === 0 };
    setValidation(validationResult);
    setOutput(schemaParsed);

    // Repair Engine
    if (!validationResult.passed) {
      console.log("Repair engine triggered", validationResult.errors);
      setStage("Repairing schema...");
      const repairRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 4000,
          system: `You are a schema repair engine. You will be given a schema with validation errors. Fix only the errors and return the complete corrected schema. Respond ONLY with valid JSON, no markdown, no explanation.`,
          messages: [{
            role: "user",
            content: `Fix these errors: ${JSON.stringify(validationResult.errors)}
In this schema: ${JSON.stringify(schemaParsed)}`
          }],
        }),
      });
      const repairData = await repairRes.json();
      const repairText = repairData.choices[0].message.content;
      const repairedSchema = safeParseJSON(repairText);
      if (!repairedSchema) {
        setError("Repair failed. Please try again with a simpler prompt.");
        setLoading(false);
        setStage("");
        return;
      }
      
      // Validate again after repair
      const revalidation = validateSchemas(repairedSchema);
      setSchema(repairedSchema);
      setValidation({ ...revalidation, repaired: true });
      setOutput(repairedSchema);
    }



  } catch (err: any) {
    console.log("CATCH BLOCK HIT", err.message);
    console.error(err);
    setError(err.message || "Something went wrong.");
  } finally {
    setLoading(false);
    setStage("");
  }
}
    return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>AppCompiler</h1>
      <p>Natural language → validated app schema</p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your application..."
        rows={6}
        style={{ width: "100%", padding: "12px", fontSize: "14px", marginTop: "20px" }}
      />

      <button
        onClick={() => runPipeline().catch((err: any) => {
          setError(err.message || "Something went wrong.");
          setLoading(false);
          setStage("");
        })}
        disabled={loading || !prompt.trim()}
        style={{ marginTop: "12px", padding: "12px 24px", fontSize: "14px" }}
      >
        {loading ? stage || "Running..." : "Generate Schema"}
      </button>

      {error && (
        <div style={{ marginTop: "16px", color: "red", padding: "12px", background: "#fff0f0", borderRadius: "8px" }}>
          ⚠ {error}
        </div>
      )}

      {intent && (
        <div style={{ marginTop: "24px" }}>
          <h2>Stage 1 — Intent</h2>
          <pre style={{ background: "#f4f4f4", padding: "16px", overflow: "auto" }}>
            {JSON.stringify(intent, null, 2)}
          </pre>
        </div>
      )}

      {architecture && (
        <div style={{ marginTop: "24px" }}>
          <h2>Stage 2 — Architecture</h2>
          <pre style={{ background: "#f4f4f4", padding: "16px", overflow: "auto" }}>
            {JSON.stringify(architecture, null, 2)}
          </pre>
        </div>
      )}

      {schema && (
        <div style={{ marginTop: "24px" }}>
          <h2>Stage 3 — Schemas</h2>
          <pre style={{ background: "#f4f4f4", padding: "16px", overflow: "auto" }}>
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      )}

      {validation && (
        <div style={{ marginTop: "24px" }}>
          <h2>Stage 4 — Validation</h2>
          <p style={{ color: validation.passed ? "green" : "red" }}>
            {validation.passed ? "✅ All checks passed" : `❌ ${validation.errors.length} errors found`}
          </p>
          {validation.checks.map((check: any, i: number) => (
            <div key={i} style={{ padding: "4px 0", color: check.pass ? "green" : "red" }}>
              {check.pass ? "✓" : "✗"} {check.msg}
            </div>
          ))}
        </div>
      )}
      </div>
  );
}



