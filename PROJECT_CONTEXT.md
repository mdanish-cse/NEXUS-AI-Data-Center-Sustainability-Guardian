# NEXUS — Project Context
## Batam Singapore Hackathon 2026

### Event
- Track: Digital Infrastructure — Data Centers
- Challenge: **Water & Energy Guardian: Sustainable Data Center Operations**
- Team size: 2
- Official build window: 13:00–06:00
- Submission deadline: 06:00, 16 August 2026
- Pre-existing code must be disclosed.
- AI tools are allowed; models and data used must be disclosed.

### Project
**Working title:** NEXUS — AI Data Center Sustainability Guardian

### Core problem
Data centers consume substantial energy and water, especially for cooling. Operators need better decision support to identify inefficiency and evaluate operational changes without compromising reliability.

### Solution
NEXUS is an AI-powered decision-support platform that helps data center operators:
**Monitor → Detect → Explain → Simulate → Optimize**

### MVP
1. Infrastructure Intelligence Dashboard
2. AI Anomaly Detection
3. What-if Energy/Water Optimization Simulator

### Core telemetry
- IT load
- IT power
- cooling power
- ambient temperature
- server temperature
- water usage
- timestamp

### Important design principle
Deterministic calculations should produce metrics, deviations, estimated impacts, and safety checks. The LLM should explain findings and generate recommendations rather than inventing numerical results.

### Safety
Recommendations must be checked against configurable thermal/reliability thresholds. If a simulated change violates a threshold, the recommendation must be rejected.

### Stack
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Supabase PostgreSQL
- OpenAI and/or Gemini API
- Vercel
- Codex as primary coding agent

### AI workflow
- Codex: primary implementation, debugging, refactoring, testing
- Claude Pro: architecture/code review and second opinion
- Gemini Pro: research and synthetic-data generation

### Team
#### Person 1 — Product / Tech Lead
Architecture, calculations, anomaly detection, AI integration, testing, Codex orchestration, pitch.

#### Person 2 — Frontend / UX Lead
Dashboard, charts, simulator UI, responsive design, animations, visual polish, demo flow.

### Scope rule
Prefer 3 polished working features over many unfinished features.

Do not over-engineer with Kubernetes, Prometheus, Grafana, microservices, IoT hardware, reinforcement learning, full digital twins, or a mobile app unless explicitly required.

### Pre-build restriction
Before the official build window, prepare planning and documentation only. Do not implement application-specific functionality such as the final dashboard, simulator, anomaly engine, database implementation, or AI integration.

### Disclosure
AI and pre-existing work must be honestly disclosed. Synthetic data should be labeled as synthetic/demo data.


### AI architecture
No LLM training or fine-tuning is required for the MVP.

Use:
Synthetic telemetry → deterministic calculations → anomaly detection → structured findings → LLM → explanation/recommendation.

The application remains the numerical source of truth. The LLM must not invent PUE, WUE, energy, water, savings, temperature, or cost values.

The LLM is used for explanation and qualitative decision support. Safety/reliability constraints remain deterministic and rule-based.
