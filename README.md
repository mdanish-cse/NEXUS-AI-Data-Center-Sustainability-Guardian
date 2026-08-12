# NEXUS

## AI Data Center Sustainability Guardian

NEXUS is a hackathon prototype that helps data-center operators monitor sustainability telemetry, identify anomalies, understand likely contributing factors, safely simulate operational changes, and evaluate optimization options.

**Monitor → Detect → Explain → Simulate → Optimize**

## Challenge

Batam Singapore Hackathon 2026  
Track: Digital Infrastructure — Data Centers  
Challenge: Water & Energy Guardian: Sustainable Data Center Operations

## MVP scope

- Infrastructure intelligence dashboard for energy, water, thermal, PUE, and WUE telemetry.
- Deterministic anomaly detection based on expected baselines and measured deviations.
- AI-assisted explanations of structured findings and qualitative recommendations.
- What-if simulator for cooling setpoints, IT workload, and ambient assumptions.
- Thermal and reliability safety gate that marks unsafe scenarios as rejected.

NEXUS is a decision-support prototype. It does not autonomously control data-center equipment.

## Technology

- Next.js, TypeScript, Tailwind CSS
- shadcn/ui and Recharts
- Supabase PostgreSQL
- OpenAI and/or Gemini API
- Vercel

## Local development

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

## Data and calculation disclosure

This prototype uses synthetic/demo telemetry unless a source is explicitly identified. It does not use confidential or proprietary data-center data.

Energy, water, cost, PUE, WUE, temperature, and savings values are derived from deterministic calculations or clearly labelled simulations. An LLM may explain structured results and offer qualitative recommendations, but is not the source of numerical values.

## AI tools disclosure

The final project will disclose the tools actually used during the event. Anticipated uses may include:

- OpenAI Codex for implementation, debugging, refactoring, and testing.
- Anthropic Claude for technical or architecture review.
- Google Gemini for research assistance or synthetic-data support.

## Pre-existing code disclosure

Before the official build window, this repository contained product, scope, safety, compliance, and teamwork documentation, plus a standard Next.js + TypeScript + Tailwind + ESLint scaffold generated with `create-next-app`.

No NEXUS-specific functionality was implemented before the build window: no dashboard, telemetry dataset, database schema, anomaly detection, simulator, safety logic, charts, or AI integration.

## Project documents

- [Product requirements](PRD.md)
- [Project context](PROJECT_CONTEXT.md)
- [Pre-build checklist](PRE_BUILD_CHECKLIST.md)
- [Pre-existing code disclosure](PRE_EXISTING_CODE_DISCLOSURE.md)
- [Team work split](TEAM_WORK_SPLIT.md)
