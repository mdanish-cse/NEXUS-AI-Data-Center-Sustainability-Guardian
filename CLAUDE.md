# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

NEXUS is a hackathon MVP (Batam Singapore Hackathon 2026, "Water & Energy Guardian: Sustainable Data Center Operations" track) built by a two-person team in a ~16-hour window (13:00–06:00, submission deadline 06:00 on 16 August 2026). It is a decision-support prototype for data-center sustainability, not a control system: **Monitor → Detect → Explain → Simulate → Optimize**.

As of now the repo contains only planning docs (`PRD.md`, `PROJECT_CONTEXT.md`, `PRE_BUILD_CHECKLIST.md`, `TEAM_WORK_SPLIT.md`) plus a fresh `create-next-app` scaffold in `web/` with no NEXUS-specific functionality yet (no dashboard, telemetry, anomaly detection, simulator, DB schema, or AI integration). See `PRE_EXISTING_CODE_DISCLOSURE.md` for the exact boundary of what predates the official build window — application-specific code must be implemented during the build window and disclosed honestly, not silently pre-built.

## Commands

All app code lives in `web/`.

```bash
cd web
npm install
npm run dev      # start dev server at http://localhost:3000
npm run build
npm run start
npm run lint      # eslint
```

There is no test runner configured yet. If tests are added during the build window, prefer testing the deterministic calculation/safety-gate logic (see below) since that is the demo's numerical source of truth.

## Architecture principles (non-negotiable for this project)

**The LLM is never the source of truth for numbers.** The pipeline is strictly:

```
Synthetic telemetry → deterministic calculations → anomaly detection → structured findings → LLM → explanation/recommendation
```

- All energy, water, cost, PUE, WUE, temperature, deviation, and savings values must be computed by deterministic application code, never generated or invented by an LLM.
- The LLM's only job is to explain structured findings already computed by the app and offer qualitative recommendations — it receives structured data as input, it does not produce numerical output.
- Optimization recommendations must pass a configurable thermal/reliability safety gate implemented in deterministic code. If a simulated scenario exceeds the threshold, it must be marked unsafe and rejected with an explanation — this check must never be delegated to the LLM.
- API keys (OpenAI/Gemini/Supabase) must only be used server-side (server routes/actions), never exposed to the client.

## Data model (target — not yet implemented)

Per `PRD.md`, Supabase Postgres tables: `data_centers`, `telemetry` (it_load, it_power, cooling_power, ambient_temperature, server_temperature, water_usage, timestamp), `alerts` (type, severity, metric, actual_value, expected_value, message), `simulations` (baseline/simulated energy & water, parameters, safety_status).

All telemetry is synthetic/demo data — never present it as real data-center data.

## MVP scope

Three features only: (1) Infrastructure Intelligence Dashboard, (2) AI Anomaly Detection (baseline vs. actual, deviation %, severity, possible causes), (3) What-if Optimization Simulator (cooling setpoint / IT workload / ambient temp → estimated energy/water/cost impact + safety result). Do not add features beyond these without explicit sign-off — see `PRD.md` §10 "Out of Scope" (no Kubernetes/microservices/real IoT/RL/digital twin/mobile app/complex auth).

## Team split (for context on ownership, not enforced by tooling)

- Person 1 (Product/Tech Lead): Supabase schema, synthetic telemetry, PUE/WUE/deviation calculations, anomaly detection, safety gate, server-side AI explanation route.
- Person 2 (Frontend/UX Lead): dashboard layout, metric cards, Recharts charts, alert list, simulator controls, AI insight display — consumes Person 1's types/contracts and must not duplicate business-logic formulas in UI components.

## Stack

Next.js (App Router, `web/src/app`), TypeScript (strict mode, `@/*` → `web/src/*`), Tailwind CSS, shadcn/ui, Recharts, Supabase Postgres, OpenAI and/or Gemini API, deployed on Vercel.
