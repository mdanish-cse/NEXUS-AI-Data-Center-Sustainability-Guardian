import { ValidationError } from "../http/errors";
import { buildScenario, isScenarioId } from "../nexus/scenarios";
import type { Scenario } from "../nexus/types";
import type { DataRepository } from "./repository";

/**
 * Demo override: an explicit scenario id (from `?scenario=` on GET routes, or a
 * `scenario` field in a POST body) bypasses whichever repository is configured
 * and serves a specific in-memory synthetic scenario directly — so a live demo
 * can jump between scenarios instantly regardless of whether Supabase is wired
 * up. Omit it to use the configured repository (Supabase or in-memory) as normal.
 */
export async function resolveScenario(
  repository: DataRepository,
  scenarioOverride: string | null | undefined,
): Promise<Scenario> {
  if (!scenarioOverride) return repository.getScenario();
  if (!isScenarioId(scenarioOverride)) {
    throw new ValidationError(
      `Unknown scenario "${scenarioOverride}". Expected one of: normal, workload-spike, cooling-inefficiency, environmental-stress, unsafe-optimization.`,
    );
  }
  return buildScenario(scenarioOverride);
}
