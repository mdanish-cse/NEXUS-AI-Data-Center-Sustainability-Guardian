import type { Alert, Scenario, SimulationResult } from "../nexus/types";
import { createMemoryRepository } from "./memoryRepository";
import { createSupabaseRepository } from "./supabaseRepository";

export interface DataRepository {
  /** Current scenario: telemetry history (for charts) + the latest sample. */
  getScenario(): Promise<Scenario>;
  saveAlert(alert: Alert): Promise<void>;
  saveSimulation(result: SimulationResult): Promise<void>;
}

let cachedRepository: DataRepository | undefined;

/**
 * Returns the Supabase-backed repository when SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are set (server-side only — never read these
 * client-side), otherwise falls back to the in-memory synthetic repository so
 * the app runs with zero external setup.
 */
export function getRepository(): DataRepository {
  if (cachedRepository) return cachedRepository;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  cachedRepository = url && serviceRoleKey ? createSupabaseRepository(url, serviceRoleKey) : createMemoryRepository();
  return cachedRepository;
}
