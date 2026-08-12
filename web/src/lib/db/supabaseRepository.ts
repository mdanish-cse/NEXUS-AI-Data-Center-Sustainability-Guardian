import { createClient } from "@supabase/supabase-js";
import { DATA_CENTER_ID } from "../nexus/scenarios";
import type { Alert, Scenario, SimulationResult, Telemetry } from "../nexus/types";
import type { DataRepository } from "./repository";

const HISTORY_LIMIT = 36;

interface TelemetryRow {
  id: string;
  data_center_id: string;
  timestamp: string;
  it_load: number;
  it_power: number;
  cooling_power: number;
  ambient_temperature: number;
  server_temperature: number;
  water_usage: number;
}

function rowToTelemetry(row: TelemetryRow): Telemetry {
  return {
    id: row.id,
    dataCenterId: row.data_center_id,
    timestamp: row.timestamp,
    itLoadPercent: row.it_load,
    itPowerMw: row.it_power,
    coolingPowerMw: row.cooling_power,
    ambientTemperatureC: row.ambient_temperature,
    serverTemperatureC: row.server_temperature,
    waterUsageLiters: row.water_usage,
  };
}

/**
 * Real Supabase-backed implementation of DataRepository, matching
 * supabase/schema.sql. Only instantiated by the repository factory when
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set — see repository.ts.
 */
export function createSupabaseRepository(url: string, serviceRoleKey: string): DataRepository {
  const client = createClient(url, serviceRoleKey);

  return {
    async getScenario(): Promise<Scenario> {
      const { data, error } = await client
        .from("telemetry")
        .select("*")
        .eq("data_center_id", DATA_CENTER_ID)
        .order("timestamp", { ascending: false })
        .limit(HISTORY_LIMIT);

      if (error) throw new Error(`Supabase telemetry query failed: ${error.message}`);
      if (!data || data.length === 0) {
        throw new Error(
          `No telemetry rows found in Supabase for data_center_id="${DATA_CENTER_ID}". Seed the telemetry table, or unset SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY to use the in-memory synthetic repository.`,
        );
      }

      const history = (data as TelemetryRow[]).map(rowToTelemetry).reverse();
      const current = history[history.length - 1];

      return {
        id: "live",
        label: "Live Supabase feed",
        description: `Telemetry read from Supabase for data center "${DATA_CENTER_ID}".`,
        history,
        current,
      };
    },

    async saveAlert(alert: Alert): Promise<void> {
      const { error } = await client.from("alerts").insert({
        id: alert.id,
        timestamp: alert.timestamp,
        type: alert.type,
        severity: alert.severity,
        metric: alert.metric,
        actual_value: alert.actualValue,
        expected_value: alert.expectedValue,
        message: alert.message,
      });
      if (error) throw new Error(`Supabase alert insert failed: ${error.message}`);
    },

    async saveSimulation(result: SimulationResult): Promise<void> {
      const { error } = await client.from("simulations").insert({
        id: result.id,
        created_at: result.createdAt,
        baseline_energy: result.baselineEnergyMwh,
        baseline_water: result.baselineWaterLiters,
        simulated_energy: result.simulatedEnergyMwh,
        simulated_water: result.simulatedWaterLiters,
        parameters: result.parameters,
        safety_status: result.safety.status,
      });
      if (error) throw new Error(`Supabase simulation insert failed: ${error.message}`);
    },
  };
}
