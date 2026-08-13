# NEXUS — Pre-Build Checklist

## Goal

Prepare everything needed before the official build window without creating application-specific functionality that would need to be disclosed as pre-existing work.

## A. Product Preparation
- [ ] Finalize project name
- [ ] Finalize one-sentence value proposition
- [ ] Confirm selected challenge
- [ ] Define target user
- [ ] Freeze the 3 MVP features
- [ ] Define demo story
- [ ] Define judge Q&A

## B. Technical Preparation
- [ ] Decide final stack
- [ ] Prepare architecture diagram
- [ ] Prepare database schema on paper/document
- [ ] Define telemetry fields
- [ ] Define anomaly calculation logic
- [ ] Define PUE/WUE calculation assumptions
- [ ] Define safety threshold assumptions
- [ ] Define simulation inputs/outputs
- [ ] Prepare AI prompt drafts
- [ ] Prepare environment-variable checklist
- [ ] Confirm deployment accounts/access

## C. AI Preparation
- [ ] Codex: primary coding agent
- [ ] Claude: reviewer/second opinion
- [ ] Gemini: research and synthetic-data assistance
- [ ] Prepare a master coding prompt
- [ ] Prepare code-review prompt
- [ ] Prepare debugging prompt
- [ ] Prepare AI disclosure text
- [ ] Track which models are actually used

## D. Design Preparation
- [ ] Dashboard wireframe
- [ ] Alert card wireframe
- [ ] Simulator wireframe
- [ ] Empty/loading/error states
- [ ] Mobile/responsive consideration
- [ ] Demo data states

## E. Compliance
- [ ] Read official rules again immediately before the event
- [ ] Confirm exact build-window time
- [ ] Confirm exact submission deadline
- [ ] Document any pre-existing code
- [ ] Document AI models used
- [ ] Document data sources
- [ ] Synthetic data clearly labeled
- [ ] Do not use confidential/proprietary data without permission
- [ ] Do not claim simulated savings as guaranteed real savings

## F. Pre-existing Code Boundary

### Safe preparation focus
- [ ] PRD
- [ ] Architecture
- [ ] Wireframes
- [ ] Research
- [ ] Formula definitions
- [ ] Prompt drafts
- [ ] Documentation
- [ ] Disclosure template

### Avoid implementing before build
- [ ] Final dashboard
- [ ] Application-specific components
- [ ] Database implementation
- [ ] Anomaly engine
- [ ] Simulator engine
- [ ] AI integration
- [ ] Final business logic
- [ ] Final deployment

## G. Event-Day Readiness
- [ ] Laptop charged
- [ ] Power adapter
- [ ] Stable internet
- [ ] GitHub access
- [ ] Vercel access
- [ ] Supabase access
- [ ] AI accounts working
- [ ] API keys ready where permitted
- [ ] Backup internet plan
- [ ] Shared project folder/repo
- [ ] Roles agreed between two teammates

## H. 16-Hour Execution Rule

Target feature freeze around 02:00.

After feature freeze:
- [ ] No new major features
- [ ] Fix bugs
- [ ] Polish UI
- [ ] Test demo path
- [ ] Write README
- [ ] Add AI/pre-existing work disclosure
- [ ] Record demo
- [ ] Submit


## I. AI Architecture Preparation

### No Model Training Required for the MVP

The NEXUS AI layer does **not** require training or fine-tuning an LLM.

Do NOT spend hackathon time on:
- [ ] Training an LLM from scratch
- [ ] Fine-tuning GPT/Gemini
- [ ] Building a large ML training pipeline

Use:

```text
Synthetic Telemetry
       ↓
Deterministic Calculations
       ↓
Anomaly Detection
       ↓
Structured Findings
       ↓
LLM (GPT/Gemini)
       ↓
Explanation + Recommendation
```

The application is the numerical source of truth. The LLM should explain findings and provide qualitative recommendations.

### Deterministic Layer

Calculate in application code:
- energy consumption
- water consumption
- PUE
- WUE
- expected vs actual cooling
- deviation percentage
- estimated simulation impact
- thermal/reliability threshold checks

The LLM must not invent these values.

### LLM Layer

Use the LLM for:
- explaining anomalies
- identifying plausible contributing factors
- generating qualitative recommendations
- communicating findings clearly

Suggested rules:

```text
You are NEXUS, a data-center sustainability decision-support assistant.

1. Never invent measurements.
2. Never invent savings percentages.
3. Use calculated metrics supplied by the application.
4. Never recommend an action that violates the safety threshold.
5. Clearly distinguish measured data from estimates.
6. Do not directly control physical infrastructure.
7. If data is insufficient, say so.
```

### Preparation Checklist

- [ ] Define system prompt
- [ ] Define structured input schema
- [ ] Define allowed recommendation types
- [ ] Define safety/reliability constraints
- [ ] Define deterministic formulas
- [ ] Prepare 2–3 anomaly scenarios
- [ ] Decide event-day model/API
- [ ] Record actual models used for disclosure

### Technical Positioning

> **NEXUS is a decision-support system where deterministic telemetry analysis and safety constraints provide the operational truth, while the LLM provides explanation and recommendation.**
