/**
 * One-off seed: pushes a synthetic scenario's telemetry history into Supabase,
 * using the exact same generator that powers the in-memory repository
 * (../src/lib/nexus/scenarios.ts) so the data is identical either way.
 *
 * Usage (from web/): npm run seed -- [scenario]
 *   scenario defaults to NEXUS_SCENARIO or "normal".
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in web/.env.local)
 * and supabase/schema.sql already applied.
 */
import { createClient } from "@supabase/supabase-js";
import { DATA_CENTER_ID, SCENARIO_IDS, buildScenario, isScenarioId } from "../src/lib/nexus/scenarios";
import type { ScenarioId } from "../src/lib/nexus/types";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in web/.env.local) before seeding.");
  process.exit(1);
}

const requested = process.argv[2] ?? process.env.NEXUS_SCENARIO ?? "normal";
if (!isScenarioId(requested)) {
  console.error(`Unknown scenario "${requested}". Expected one of: ${SCENARIO_IDS.join(", ")}.`);
  process.exit(1);
}
const scenarioId: ScenarioId = requested;

async function main() {
  const scenario = buildScenario(scenarioId);
  const client = createClient(url!, serviceRoleKey!);

  const rows = scenario.history.map((t) => ({
    data_center_id: DATA_CENTER_ID,
    timestamp: t.timestamp,
    it_load: t.itLoadPercent,
    it_power: t.itPowerMw,
    cooling_power: t.coolingPowerMw,
    ambient_temperature: t.ambientTemperatureC,
    server_temperature: t.serverTemperatureC,
    water_usage: t.waterUsageLiters,
  }));

  console.log(`Clearing existing telemetry for "${DATA_CENTER_ID}"...`);
  const { error: deleteError } = await client.from("telemetry").delete().eq("data_center_id", DATA_CENTER_ID);
  if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);

  console.log(`Inserting ${rows.length} telemetry rows for scenario "${scenarioId}"...`);
  const { error: insertError } = await client.from("telemetry").insert(rows);
  if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

  console.log('Done. Restart "npm run dev" and GET /api/findings will read this from Supabase.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
