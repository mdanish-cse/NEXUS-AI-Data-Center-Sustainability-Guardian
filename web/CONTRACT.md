# NEXUS data & API contract

Agreed contract between the deterministic backend (`src/lib/nexus`, `src/lib/db`, `src/lib/ai`) and the dashboard/simulator UI. Types are the source of truth: `src/lib/nexus/types.ts`.

## Units

| Field | Unit |
|---|---|
| `itPowerMw`, `coolingPowerMw`, `totalPowerMw` | megawatts (MW) |
| `itLoadPercent` | percent, 0-100 |
| `ambientTemperatureC`, `serverTemperatureC` | °C |
| `waterUsageLiters` (on `Telemetry`) | liters, per 5-minute sample |
| `pue`, `wue` | unitless ratios |
| `*EnergyMwh`, `*WaterLiters`, `energyDeltaMwh`, `waterDeltaLiters` (on `SimulationResult`) | **hourly-rate estimates** (MWh/hr, L/hr) — not accumulated totals, not the 5-minute sample value |
| `estimatedCostDeltaUsd` | USD/hr |
| `timestamp` / `createdAt` | ISO-8601 string, UTC |

## Response envelope

Every route returns JSON. Success: `{ "data": ... }` with HTTP 200. Failure: `{ "error": "message" }` with HTTP 400 (validation) or 500 (server/upstream). There is no separate loading state from the server — the client owns loading UI around the fetch.

## `GET /api/findings`

No body. Returns the active scenario's telemetry history, current sample, computed metrics, and anomaly findings. Side-effect free (safe to poll).

```json
{
  "data": {
    "scenario": { "id": "cooling-inefficiency", "label": "...", "description": "..." },
    "history": [ /* Telemetry[], oldest first, ~36 points */ ],
    "current": { /* Telemetry, most recent */ },
    "metrics": { "totalPowerMw": 0, "pue": 0, "wue": 0, "expectedCoolingPowerMw": 0, "coolingDeviationPercent": 0 },
    "findings": [ /* Finding[], only metrics whose deviation clears the "low" severity threshold */ ]
  }
}
```

## `POST /api/simulate`

Body: `SimulationParams`, all fields optional (omit a field to leave that input unchanged).

```json
{ "coolingSetpointDeltaC": 2, "itWorkloadDeltaPercent": 10, "ambientTemperatureDeltaC": 0 }
```

Returns a `SimulationResult` (see units table above), including `safety: { status: "safe" | "unsafe", predictedServerTemperatureC, maxSafeServerTemperatureC, reason? }` and `recommended` (`true` only when `safety.status === "safe"`). An "unsafe" result is not an HTTP error — it's a normal 200 response the UI should render as a rejected scenario.

## `POST /api/explain`

Body is either:

```json
{ "kind": "findings", "findings": [ /* Finding[] from GET /api/findings */ ] }
```

or

```json
{ "kind": "simulation", "simulation": { /* SimulationResult from POST /api/simulate */ } }
```

Pass through exactly what the other two endpoints returned — don't recompute or duplicate the business logic client-side. Returns `{ "data": { "explanation": "...", "provider": "stub" | "openai" | "gemini" } }`. Works with zero API keys (falls back to a templated `stub` explanation); never invents numbers not present in the input.
