import { NextResponse } from "next/server";
import { detectAnomalies } from "@/lib/nexus/anomaly";
import { computeMetrics } from "@/lib/nexus/calculations";
import { getRepository } from "@/lib/db/repository";
import { resolveScenario } from "@/lib/db/resolveScenario";
import { ValidationError, errorMessage } from "@/lib/http/errors";

/**
 * GET /api/findings — current scenario telemetry, computed metrics, and
 * anomaly findings. Side-effect free.
 *
 * Optional `?scenario=<id>` overrides the configured repository with a
 * specific synthetic scenario for demo purposes — see resolveScenario.ts.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = await resolveScenario(getRepository(), searchParams.get("scenario"));
    const metrics = computeMetrics(scenario.current);
    const findings = detectAnomalies(scenario.current);

    return NextResponse.json({
      data: {
        scenario: { id: scenario.id, label: scenario.label, description: scenario.description },
        history: scenario.history,
        current: scenario.current,
        metrics,
        findings,
      },
    });
  } catch (error) {
    const status = error instanceof ValidationError ? 400 : 500;
    return NextResponse.json({ error: errorMessage(error) }, { status });
  }
}
