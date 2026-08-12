import { NextResponse } from "next/server";
import { detectAnomalies } from "@/lib/nexus/anomaly";
import { computeMetrics } from "@/lib/nexus/calculations";
import { getRepository } from "@/lib/db/repository";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

/** GET /api/findings — current scenario telemetry, computed metrics, and anomaly findings. Side-effect free. */
export async function GET() {
  try {
    const repository = getRepository();
    const scenario = await repository.getScenario();
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
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
