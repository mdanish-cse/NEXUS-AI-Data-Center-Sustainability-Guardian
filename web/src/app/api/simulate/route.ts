import { NextResponse } from "next/server";
import { getRepository } from "@/lib/db/repository";
import { resolveScenario } from "@/lib/db/resolveScenario";
import { runSimulation } from "@/lib/nexus/simulator";
import type { SimulationParams } from "@/lib/nexus/types";
import { ValidationError, errorMessage } from "@/lib/http/errors";

const NUMERIC_FIELDS: (keyof SimulationParams)[] = [
  "coolingSetpointDeltaC",
  "itWorkloadDeltaPercent",
  "ambientTemperatureDeltaC",
];

function parseSimulationParams(body: unknown): SimulationParams {
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const params: SimulationParams = {};
  for (const field of NUMERIC_FIELDS) {
    const value = (body as Record<string, unknown>)[field];
    if (value === undefined) continue;
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new ValidationError(`"${field}" must be a number if provided.`);
    }
    params[field] = value;
  }
  return params;
}

function parseScenarioOverride(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const value = (body as Record<string, unknown>).scenario;
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new ValidationError('"scenario" must be a string if provided.');
  return value;
}

/**
 * POST /api/simulate — body: SimulationParams (all fields optional) plus an
 * optional "scenario" override (see resolveScenario.ts). Returns
 * SimulationResult, including the safety verdict. Persists the run.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const params = parseSimulationParams(body);
    const scenarioOverride = parseScenarioOverride(body);

    const repository = getRepository();
    const scenario = await resolveScenario(repository, scenarioOverride);
    const result = runSimulation(scenario.current, params);
    await repository.saveSimulation(result);

    return NextResponse.json({ data: result });
  } catch (error) {
    const status = error instanceof ValidationError ? 400 : 500;
    return NextResponse.json({ error: errorMessage(error) }, { status });
  }
}
