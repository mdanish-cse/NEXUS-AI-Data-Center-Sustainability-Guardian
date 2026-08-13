# Coolara — Work split during the build window

## Working principle

Both team members work in the same Next.js application under `web/`. Do not
edit the same file simultaneously without coordination. Use small, descriptive
commits or branches so integration remains fast and reversible.

## Person 1 — Backend / Product / Technical Lead

Focus on data and deterministic logic implemented during the build window:

- Create the Supabase connection and schema.
- Provide synthetic telemetry and stable demo scenarios.
- Implement PUE, WUE, baseline deviation, and estimate calculations.
- Implement deterministic anomaly detection and the safety gate.
- Add server-side AI explanation routes; API keys remain server-side only.
- Write tests for calculations and safety rules.

Agree these contracts before integration:

- Telemetry, alert, and simulation-result shapes.
- Endpoint or server-action names and loading/error states.
- Units for each metric and timestamp format.

## Person 2 — Frontend / UX Lead

Focus on the operator experience implemented during the build window:

- Build the dashboard layout and operational status states.
- Build metric cards, Recharts graphs, alert lists, and the AI insight view.
- Build simulator controls and safe/unsafe result states.
- Maintain responsive design, accessibility, and the demo flow.
- Consume Person 1's types/contracts; do not duplicate business formulas in UI components.

## Suggested integration sequence

1. Agree on the TypeScript contract and data units.
2. Backend provides one stable synthetic scenario.
3. Frontend connects the dashboard to that contract.
4. Add the simulator and safety state.
5. Add the AI explanation after structured findings are stable.
6. Run the end-to-end demo path and freeze features.

## Pre-existing work boundary

This document is a work plan. The Coolara dashboard, database, telemetry,
anomaly detection, simulator, and AI integration must be implemented during the
official build window and disclosed accurately in the final README.
