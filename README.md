# AppCompiler

**Natural language → validated, cross-consistent app schema**

A multi-stage LLM pipeline that converts a plain English description into a complete, validated app blueprint.

## Live Demo
[app-compiler-psi.vercel.app](https://app-compiler-psi.vercel.app)

## Project Phases

**Phase A — Schema Generation (Complete)**
Natural language → validated DB/API/UI/Auth schemas with cross-layer consistency checks and repair engine.

**Phase B — Code Generation (Planned)**
Schema → actual runnable code files (Next.js pages, Prisma models, API routes, React components).

**Phase C — Full Deployment (Planned)**
Natural language → working deployed application. End to end, no manual steps.

## Pipeline Architecture

User Prompt
│
▼
[Stage 1] Intent Extraction
→ entities, roles, features, ambiguities, assumptions
[Stage 2] Architecture Design
→ entity relationships, feature components, tech stack
[Stage 3] Schema Generation
→ DB schema + API schema + UI schema + Auth schema
[Stage 4] Validation Engine (deterministic)
→ cross-layer consistency checks
→ if errors found → Repair Engine → re-validate
[Final] Validated App Blueprint

## Key Design Decisions

- **Typed JSON contracts** — each stage outputs a strict schema, not freeform text
- **Pipeline not single prompt** — each stage feeds into the next, preventing cross-layer drift
- **Deterministic validator** — pure code checks, no LLM involved in validation
- **Targeted repair** — only broken layers are re-generated, not the full pipeline
- **Graceful error handling** — rate limits and malformed responses shown to user clearly

## Validation Checks

1. Every API endpoint entity must exist in DB schema
2. All UI page roles must be defined in auth schema

## Tech Stack

- **Next.js 14** — frontend + API routes (solves CORS)
- **TypeScript** — type safety across pipeline
- **Groq LLaMA 3.3 70B** — LLM at each stage
- **Vercel** — deployment

## Local Development

```bash
# Install dependencies
npm install

# Create environment file
echo "GROQ_API_KEY=your_key_here" > .env.local

# Run locally
npm run dev
```

## Known Limitations

- Very complex prompts (8+ entities) may hit token limits
- LLM outputs are non-deterministic — same prompt may produce different schemas
- Free Groq tier has 100k token daily limit
