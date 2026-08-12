"use client";

import type { ComputedMetrics, Finding, ScenarioId, SimulationParams, SimulationResult, Telemetry } from "@/lib/nexus/types";

export interface FindingsResponse {
  scenario: { id: ScenarioId | "live"; label: string; description: string };
  history: Telemetry[];
  current: Telemetry;
  metrics: ComputedMetrics;
  findings: Finding[];
}

export interface ExplainResponse {
  explanation: string;
  provider: "stub" | "openai" | "gemini";
}

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(typeof json?.error === "string" ? json.error : `Request failed (${res.status}).`);
  }
  return json.data as T;
}

/** GET /api/findings, optionally overridden to a specific synthetic scenario for demo control. */
export async function fetchFindings(scenario?: ScenarioId): Promise<FindingsResponse> {
  const url = scenario ? `/api/findings?scenario=${encodeURIComponent(scenario)}` : "/api/findings";
  const res = await fetch(url);
  return unwrap<FindingsResponse>(res);
}

/** POST /api/simulate — the server resolves the baseline telemetry from `scenario`; only deltas are sent. */
export async function postSimulate(params: SimulationParams, scenario?: ScenarioId): Promise<SimulationResult> {
  const res = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, scenario }),
  });
  return unwrap<SimulationResult>(res);
}

/** POST /api/explain with a findings payload — pass through exactly what GET /api/findings returned. */
export async function postExplainFindings(findings: Finding[]): Promise<ExplainResponse> {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "findings", findings }),
  });
  return unwrap<ExplainResponse>(res);
}
