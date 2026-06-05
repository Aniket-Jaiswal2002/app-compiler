# App Compiler Pipeline

Convert natural language into validated, executable app schemas.

## What It Does
Input: "Build a CRM with login, contacts, and Stripe payments"
Output: Complete DB schema, API endpoints, UI pages, Auth roles — validated and ready to use

## Pipeline Architecture
1. **Intent Extraction** — parses user prompt into structured intent (features, roles, monetization)
2. **Architecture Design** — converts intent into entities, flows, and auth strategy
3. **Schema Generation** — produces DB tables, API endpoints, UI pages, Auth roles
4. **Validation + Repair** — detects cross-layer inconsistencies, auto-repairs without full retry
5. **Runtime Preview** — generates Express routes, React routes, Prisma schema from output

## How to Run
1. Open `index.html` in a browser
2. Enter any app description
3. Click Generate Schema
4. Watch the 5-stage pipeline run in real time

No build step. No server. No install.

## Folder Structure

```
app-compiler/
├── index.html           — main UI + pipeline orchestrator
├── pipeline/
│   ├── intent.js        — stage 1: intent extraction
│   ├── architecture.js  — stage 2: architecture design
│   ├── schema.js        — stage 3: schema generation
│   └── repair.js        — stage 4: auto repair
├── validation/
│   └── validator.js     — cross-layer consistency checks
├── runtime/
│   └── preview.js       — generates executable output
└── evaluation/
├── prompts.js        — 20 test prompts (10 real + 10 edge cases)
└── runner.js         — evaluation framework with metrics
```

## Evaluation
20 prompts tested — 10 real product prompts + 10 edge cases (vague, conflicting, incomplete).

Metrics tracked per run:
- Success rate
- Retries per request
- Failure type
- Latency

## Tradeoffs
| Factor | Decision | Reason |
|--------|----------|--------|
| Latency | 5 sequential LLM calls (~15s) | Each stage needs previous output |
| Cost | ~$0.02 per run | claude-sonnet-4, 1000 max tokens per call |
| Repair | 1 targeted repair call, not full retry | Faster, cheaper, more precise |
| Consistency | Strict JSON-only prompts | Reduces hallucination and parsing failures |

## Tech
- Vanilla HTML/JS — no framework, no build step
- Anthropic Claude API (claude-sonnet-4)
- Runs entirely in the browser
