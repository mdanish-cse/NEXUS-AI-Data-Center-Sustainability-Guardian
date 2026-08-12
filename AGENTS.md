# NEXUS — Codex Agent Instructions

## Mission

Build NEXUS as a hackathon MVP for the Batam Singapore Hackathon 2026 Digital Infrastructure / Data Centers challenge.

The product focuses on sustainable water and energy operations.

## Core Principle

**Monitor → Detect → Explain → Simulate → Optimize**

## Development Constraints

- Two-person team
- Approximately 16-hour build window
- Prioritize demo reliability
- Avoid unnecessary dependencies
- Avoid over-engineering
- Do not introduce microservices unless absolutely necessary
- Prefer simple, readable TypeScript
- Keep components modular but lightweight

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Supabase PostgreSQL
- OpenAI and/or Gemini API
- Vercel

## Coding Behavior

Before changing code:
1. Inspect the repository.
2. Understand existing structure.
3. Identify the smallest implementation needed.
4. Reuse existing components when appropriate.
5. Avoid rewriting working code unnecessarily.

After changes:
1. Run the relevant tests/checks.
2. Run lint/type checks where available.
3. Fix errors.
4. Verify the affected user flow.

## Data Rules

Use synthetic/demo telemetry.

Do not invent claims that imply access to a real data center.

Numerical metrics must come from deterministic calculations whenever possible.

Do not allow an LLM to invent:
- energy savings,
- water savings,
- PUE,
- WUE,
- temperature values,
- cost calculations.

The LLM may explain structured findings and provide qualitative recommendations.

## Safety

Optimization recommendations must pass a configurable thermal/reliability threshold.

If a scenario exceeds the threshold:
- mark it unsafe,
- reject the optimization,
- explain the reason.

## UI

The interface should feel like a professional infrastructure operations product:
- clear hierarchy,
- strong status indicators,
- readable metrics,
- useful charts,
- minimal clutter,
- responsive layout.

Do not add visual effects that reduce usability.

## Scope

MVP features:
1. Infrastructure Intelligence Dashboard
2. AI Anomaly Detection
3. What-if Optimization Simulator

Do not add major new features without explicit approval.

## AI

Codex is the primary implementation agent.

Claude and Gemini may be used externally for review/research, but do not assume their outputs are correct.

When a task is ambiguous:
- state the assumption,
- choose the simplest reasonable implementation,
- continue without introducing unnecessary complexity.

## Security

- Never hardcode API keys.
- Never expose secrets to the client.
- Use environment variables.
- Do not commit `.env` files containing secrets.
- Validate user-controlled inputs.

## Hackathon Compliance

Application-specific code must be created within the official build window.

Do not falsely claim that code, data, models, or tools were not used.

README should contain honest disclosure of:
- pre-existing code,
- AI models/tools,
- data sources,
- synthetic data.

## Definition of Done

A feature is done only when:
- it works in the intended user flow,
- it does not break existing functionality,
- relevant checks pass,
- it is demoable,
- it remains within MVP scope.
