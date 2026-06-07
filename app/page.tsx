"use client"
import { useState } from "react"
export default function Home() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [output,setOutput] = useState(null);
    const [stage, setStage] = useState("");
    const [intent, setIntent] = useState<any>(null);
    const [architecture, setArchitecture] = useState(null);
    const [schema, setSchema] = useState(null);
    const [validation, setValidation] = useState<any>(null);
    const [error,setError] = useState("");
    const [activeTab, setActiveTab] = useState("intent");
    
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
    if (intentData.error) {
      setError(intentData.error.message || "API error. Please try again.");
      setLoading(false);
      setStage("");
      return;
    }
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
    setActiveTab("intent");

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
    if (archData.error) {
      setError(archData.error.message || "API error. Please try again.");
      setLoading(false);
      setStage("");
      return;
    }
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
    setActiveTab("architecture"); 
    
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
    if (schemaData.error) {
      setError(schemaData.error.message || "API error. Please try again.");
      setLoading(false);
      setStage("");
      return;
    }
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
    setActiveTab("schema");

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
    setActiveTab("validation");
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
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Left Panel */}
      <div style={{ width: "360px", minWidth: "360px", borderRight: "1px solid #1e1e2e", display: "flex", flexDirection: "column", background: "#0f0f17" }}>
        
        {/* Header */}
        <div style={{ padding: "24px", borderBottom: "1px solid #1e1e2e" }}>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.5px" }}>
            App<span style={{ color: "#6366f1" }}>Compiler</span>
          </div>
          <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px", letterSpacing: "0.05em" }}>NATURAL LANGUAGE → APP SCHEMA</div>
        </div>

        {/* Prompt Input */}
        <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#4b5563", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your application...&#10;&#10;Example: Build a CRM with login, contacts, dashboard, admin and user roles, and payments."
            style={{ flex: 1, padding: "12px", fontSize: "13px", lineHeight: "1.6", border: "1px solid #2a2a3e", borderRadius: "8px", resize: "none", outline: "none", fontFamily: "'Inter', sans-serif", color: "#e2e8f0", background: "#1a1a2e" }}
          />
        </div>

        {/* Examples */}
        <div style={{ padding: "0 20px", marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Quick Examples</div>
          {[
            "Build a CRM with login, contacts, dashboard, admin and user roles, and payments.",
            "Build a blog with posts, comments, and admin and user roles.",
            "Build a task manager with projects, tasks, and team collaboration."
          ].map((ex, i) => (
            <button key={i} onClick={() => setPrompt(ex)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", marginBottom: "4px", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: "6px", fontSize: "11px", color: "#9ca3af", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              → {ex.slice(0, 50)}...
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <div style={{ padding: "20px", borderTop: "1px solid #1e1e2e" }}>
          {error && (
            <div style={{ marginBottom: "12px", padding: "10px 12px", background: "#2d1515", border: "1px solid #7f1d1d", borderRadius: "6px", fontSize: "12px", color: "#fca5a5" }}>
              ⚠ {error}
            </div>
          )}
          <button
            onClick={() => runPipeline().catch((err: any) => {
              setError(err.message || "Something went wrong.");
              setLoading(false);
              setStage("");
            })}
            disabled={loading || !prompt.trim()}
            style={{ width: "100%", padding: "12px", background: loading ? "#2a2a3e" : "#6366f1", color: loading ? "#6b7280" : "#ffffff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            {loading ? stage || "Running..." : "Generate Schema →"}
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0a0a12", overflow: "hidden" }}>
        
        {/* Stage Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1e1e2e", background: "#0f0f17", padding: "0 24px" }}>
          {[
            { id: "intent", label: "1. Intent", data: intent },
            { id: "architecture", label: "2. Architecture", data: architecture },
            { id: "schema", label: "3. Schema", data: schema },
            { id: "validation", label: "4. Validation", data: validation },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ 
                padding: "14px 16px", 
                border: "none", 
                borderBottom: activeTab === tab.id ? "2px solid #6366f1" : "2px solid transparent", 
                background: "transparent", 
                fontSize: "13px", 
                fontWeight: activeTab === tab.id ? "600" : "400", 
                color: activeTab === tab.id ? "#ffffff" : "#4b5563", 
                cursor: "pointer", 
                fontFamily: "'Inter', sans-serif", 
                display: "flex", 
                alignItems: "center", 
                gap: "6px" 
              }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: tab.data ? "#10b981" : "#d1d5db", display: "inline-block" }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Output Area */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          
          {/* Empty state */}
          {!intent && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⬡</div>
              <div style={{ fontSize: "16px", fontWeight: "500", color: "#e2e8f0" }}>Ready to compile</div>
              <div style={{ fontSize: "13px", marginTop: "8px" }}>Enter a prompt and click Generate Schema</div>
            </div>
          )}

          {/* Stage 1 - Intent */}
          {activeTab === "intent" && intent && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Intent Extraction</div>
              {intent.ambiguities?.length > 0 && (
                <div style={{ padding: "12px 16px", background: "#1f1a0a", border: "1px solid #3d3000", borderRadius: "8px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#fbbf24", marginBottom: "6px" }}>⚠ AMBIGUITIES</div>
                  {intent.ambiguities.map((a: string, i: number) => <div key={i} style={{ fontSize: "12px", color: "#fcd34d" }}>• {a}</div>)}
                </div>
              )}
              {intent.assumptions?.length > 0 && (
                <div style={{ padding: "12px 16px", background: "#0a1f0f", border: "1px solid #003d1a", borderRadius: "8px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#34d399", marginBottom: "6px" }}>✓ ASSUMPTIONS</div>
                  {intent.assumptions.map((a: string, i: number) => <div key={i} style={{ fontSize: "12px", color: "#6ee7b7" }}>• {a}</div>)}
                </div>
              )}
              <pre style={{ background: "#1f2937", color: "#e5e7eb", padding: "20px", borderRadius: "8px", fontSize: "12px", overflow: "auto", lineHeight: "1.6" }}>
                {JSON.stringify(intent, null, 2)}
              </pre>
            </div>
          )}

          {/* Stage 2 - Architecture */}
          {activeTab === "architecture" && architecture && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Architecture Design</div>
              <pre style={{ background: "#1f2937", color: "#e5e7eb", padding: "20px", borderRadius: "8px", fontSize: "12px", overflow: "auto", lineHeight: "1.6" }}>
                {JSON.stringify(architecture, null, 2)}
              </pre>
            </div>
          )}

          {/* Stage 3 - Schema */}
          {activeTab === "schema" && schema && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Generated Schemas</div>
              <pre style={{ background: "#1f2937", color: "#e5e7eb", padding: "20px", borderRadius: "8px", fontSize: "12px", overflow: "auto", lineHeight: "1.6" }}>
                {JSON.stringify(schema, null, 2)}
              </pre>
            </div>
          )}

          {/* Stage 4 - Validation */}
          {activeTab === "validation" && validation && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Validation Results</div>
              <div style={{ padding: "16px", background: validation.passed ? "#0a1f0f" : "#1f0a0a", border: `1px solid ${validation.passed ? "#bbf7d0" : "#fecaca"}`, borderRadius: "8px", marginBottom: "16px" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: validation.passed ? "#34d399" : "#f87171" }}>
                  {validation.passed ? "✅ All checks passed" : `❌ ${validation.errors.length} errors found`}
                </div>
                {validation.repaired && <div style={{ fontSize: "12px", color: "#d97706", marginTop: "4px" }}>🔧 Schema was automatically repaired</div>}
              </div>
              <div style={{ background: "#0f0f17", border: "1px solid #1e1e2e", borderRadius: "8px", overflow: "hidden" }}>
                {validation.checks.map((check: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", borderBottom: i < validation.checks.length - 1 ? "1px solid #1e1e2e" : "none" }}>
                    <span style={{ color: check.pass ? "#10b981" : "#ef4444", fontSize: "14px" }}>{check.pass ? "✓" : "✗"}</span>
                    <span style={{ fontSize: "12px", color: "#e2e8f0", fontFamily: "monospace" }}>{check.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



