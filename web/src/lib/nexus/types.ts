/**
 * Shared data contract for the NEXUS deterministic layer.
 *
 * Units (fixed across the whole app):
 * - power: megawatts (MW)
 * - energy: megawatt-hours (MWh)
 * - water: liters (L)
 * - temperature: degrees Celsius (°C)
 * - cost: USD
 * - timestamps: ISO-8601 strings, UTC
 */

export type ScenarioId =
  | "normal"
  | "workload-spike"
  | "cooling-inefficiency"
  | "environmental-stress"
  | "unsafe-optimization"
  | "critical-facility-stress";

export interface Telemetry {
  id: string;
  dataCenterId: string;
  timestamp: string;
  itLoadPercent: number;
  itPowerMw: number;
  coolingPowerMw: number;
  ambientTemperatureC: number;
  serverTemperatureC: number;
  waterUsageLiters: number;
}

export interface ComputedMetrics {
  totalPowerMw: number;
  pue: number;
  wue: number;
  expectedCoolingPowerMw: number;
  coolingDeviationPercent: number;
}

export type Severity = "normal" | "low" | "medium" | "high";

export interface Finding {
  id: string;
  timestamp: string;
  metric: "cooling_power" | "water_usage" | "server_temperature";
  actualValue: number;
  expectedValue: number;
  deviationPercent: number;
  severity: Severity;
  message: string;
  possibleCauses: string[];
}

export interface Alert {
  id: string;
  timestamp: string;
  type: Finding["metric"];
  severity: Severity;
  metric: string;
  actualValue: number;
  expectedValue: number;
  message: string;
}

export interface SimulationParams {
  coolingSetpointDeltaC?: number;
  itWorkloadDeltaPercent?: number;
  ambientTemperatureDeltaC?: number;
}

export interface SafetyResult {
  status: "safe" | "unsafe";
  predictedServerTemperatureC: number;
  maxSafeServerTemperatureC: number;
  reason?: string;
}

/** All energy/water/cost figures are hourly-rate estimates (MWh/hr, L/hr, USD/hr) derived from instantaneous power, not accumulated totals. */
export interface SimulationResult {
  id: string;
  createdAt: string;
  parameters: SimulationParams;
  baselineEnergyMwh: number;
  baselineWaterLiters: number;
  simulatedEnergyMwh: number;
  simulatedWaterLiters: number;
  energyDeltaMwh: number;
  waterDeltaLiters: number;
  estimatedCostDeltaUsd: number;
  pueBefore: number;
  pueAfter: number;
  wueBefore: number;
  wueAfter: number;
  safety: SafetyResult;
  /** true only when safety.status === "safe" — simulator never recommends an unsafe scenario. */
  recommended: boolean;
}

export interface Scenario {
  /** "live" identifies a Supabase-backed scenario, whose synthetic profile (if any) is unknown to the app. */
  id: ScenarioId | "live";
  label: string;
  description: string;
  /** Most recent point last. */
  history: Telemetry[];
  current: Telemetry;
}
