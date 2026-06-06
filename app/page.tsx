"use client"
import { useState } from "react"
export default function Home() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [output,setOutput] = useState(null);

async function runPipeline() {
    setLoading(true);
    setOutput(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content[0].text;
      const parsed = JSON.parse(text);
      setOutput(parsed);
      } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
        style={{ width: "100%", padding: "12px", fontSize: "14px" }}
      />

      <button
        onClick={() => runPipeline()}
        disabled={loading || !prompt.trim()}
        style={{ marginTop: "12px", padding: "12px 24px", fontSize: "14px" }}
      >
        {loading ? "Running..." : "Generate Schema"}
      </button>

      {output && (
        <div style={{ marginTop: "24px" }}>
          <h2>Output</h2>
          <pre style={{ background: "#f4f4f4", padding: "16px", overflow: "auto" }}>
            {JSON.stringify(output, null, 2)}
          </pre>
        </div>
      )}
      </div>
  );
}


