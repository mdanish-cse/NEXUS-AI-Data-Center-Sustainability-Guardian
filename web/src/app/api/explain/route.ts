import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import type { ExplanationPromptInput } from "@/lib/ai/prompt";
import type { Finding, SimulationResult } from "@/lib/nexus/types";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

class ValidationError extends Error {}

function parseInput(body: unknown): ExplanationPromptInput {
  if (typeof body !== "object" || body === null || !("kind" in body)) {
    throw new ValidationError('Request body must be {"kind":"findings","findings":[...]} or {"kind":"simulation","simulation":{...}}.');
  }
  const b = body as Record<string, unknown>;
  if (b.kind === "findings") {
    if (!Array.isArray(b.findings)) throw new ValidationError('"findings" must be an array.');
    return { kind: "findings", findings: b.findings as Finding[] };
  }
  if (b.kind === "simulation") {
    if (typeof b.simulation !== "object" || b.simulation === null) {
      throw new ValidationError('"simulation" must be an object.');
    }
    return { kind: "simulation", simulation: b.simulation as SimulationResult };
  }
  throw new ValidationError('"kind" must be "findings" or "simulation".');
}

/**
 * POST /api/explain — body: {kind:"findings", findings} from GET /api/findings,
 * or {kind:"simulation", simulation} from POST /api/simulate. Returns
 * {explanation, provider}. This is the only route that reads an AI API key —
 * always server-side (see lib/ai/provider.ts); it never invents metrics.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = parseInput(body);

    const provider = getAIProvider();
    const explanation = await provider.explain(input);

    return NextResponse.json({ data: { explanation, provider: provider.name } });
  } catch (error) {
    const status = error instanceof ValidationError ? 400 : 500;
    return NextResponse.json({ error: errorMessage(error) }, { status });
  }
}
