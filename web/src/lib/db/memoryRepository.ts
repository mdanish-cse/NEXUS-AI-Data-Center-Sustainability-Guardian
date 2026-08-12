import { buildScenario, isScenarioId } from "../nexus/scenarios";
import type { Alert, Scenario, SimulationResult } from "../nexus/types";
import type { DataRepository } from "./repository";

function activeScenarioId() {
  const fromEnv = process.env.NEXUS_SCENARIO;
  return fromEnv && isScenarioId(fromEnv) ? fromEnv : "normal";
}

/**
 * Zero-setup default: regenerates the active synthetic scenario on every read
 * (deterministic per scenario id, seeded — see scenarios.ts) so the dashboard
 * has live-looking data with no database required. Saved alerts/simulations
 * are kept in memory only (reset on server restart).
 */
export function createMemoryRepository(): DataRepository {
  const savedAlerts: Alert[] = [];
  const savedSimulations: SimulationResult[] = [];

  return {
    async getScenario(): Promise<Scenario> {
      return buildScenario(activeScenarioId());
    },
    async saveAlert(alert: Alert): Promise<void> {
      savedAlerts.push(alert);
    },
    async saveSimulation(result: SimulationResult): Promise<void> {
      savedSimulations.push(result);
    },
  };
}
