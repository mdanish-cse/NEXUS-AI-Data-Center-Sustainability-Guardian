import {
  calculatePue,
  calculateWue,
  expectedCoolingPowerMw,
  powerToEnergyMwh,
  predictServerTemperatureC,
} from "./calculations";
import {
  COOLING_SETPOINT_SENSITIVITY_PER_C,
  ENERGY_COST_USD_PER_MWH,
  MAX_IT_LOAD_PERCENT,
  MIN_IT_LOAD_PERCENT,
  SAMPLE_INTERVAL_HOURS,
  WATER_COST_USD_PER_LITER,
  WATER_INTENSITY_L_PER_KWH,
} from "./constants";
import { evaluateSafety } from "./safetyGate";
import type { SimulationParams, SimulationResult, Telemetry } from "./types";

const CAPACITY_MW_LOOKUP_FACTOR = 100; // itLoadPercent is itPowerMw as a % of capacity; recovered from the baseline sample.

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * FR-04/FR-05: applies a what-if parameter change to a baseline telemetry
 * sample and returns the estimated energy/water/cost impact plus the safety
 * verdict. All figures here are deterministic — the LLM only explains them.
 */
export function runSimulation(baseline: Telemetry, params: SimulationParams): SimulationResult {
  const capacityMw = baseline.itLoadPercent > 0 ? (baseline.itPowerMw / baseline.itLoadPercent) * CAPACITY_MW_LOOKUP_FACTOR : baseline.itPowerMw;

  const newItLoadPercent = clamp(
    baseline.itLoadPercent + (params.itWorkloadDeltaPercent ?? 0),
    MIN_IT_LOAD_PERCENT,
    MAX_IT_LOAD_PERCENT,
  );
  const newItPowerMw = (capacityMw * newItLoadPercent) / CAPACITY_MW_LOOKUP_FACTOR;
  const newAmbientTemperatureC = baseline.ambientTemperatureC + (params.ambientTemperatureDeltaC ?? 0);

  const newExpectedCoolingMw = expectedCoolingPowerMw(newItPowerMw, newAmbientTemperatureC);
  const setpointDelta = params.coolingSetpointDeltaC ?? 0;
  const coolingReductionFactor = clamp(1 - COOLING_SETPOINT_SENSITIVITY_PER_C * setpointDelta, 0, 1.5);
  const newCoolingPowerMw = newExpectedCoolingMw * coolingReductionFactor;

  const predictedServerTemperatureC = predictServerTemperatureC(newCoolingPowerMw, newExpectedCoolingMw);
  const newWaterUsageLiters = newCoolingPowerMw * 1000 * SAMPLE_INTERVAL_HOURS * WATER_INTENSITY_L_PER_KWH;

  const baselineEnergyMwh = powerToEnergyMwh(baseline.itPowerMw + baseline.coolingPowerMw, 1);
  const simulatedEnergyMwh = powerToEnergyMwh(newItPowerMw + newCoolingPowerMw, 1);
  const energyDeltaMwh = simulatedEnergyMwh - baselineEnergyMwh;

  const baselineWaterLiters = baseline.waterUsageLiters * (1 / SAMPLE_INTERVAL_HOURS); // normalize to a per-hour rate, same basis as energy
  const simulatedWaterLiters = newWaterUsageLiters * (1 / SAMPLE_INTERVAL_HOURS);
  const waterDeltaLiters = simulatedWaterLiters - baselineWaterLiters;

  const estimatedCostDeltaUsd = energyDeltaMwh * ENERGY_COST_USD_PER_MWH + waterDeltaLiters * WATER_COST_USD_PER_LITER;

  const safety = evaluateSafety(predictedServerTemperatureC);

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    parameters: params,
    baselineEnergyMwh,
    baselineWaterLiters,
    simulatedEnergyMwh,
    simulatedWaterLiters,
    energyDeltaMwh,
    waterDeltaLiters,
    estimatedCostDeltaUsd,
    pueBefore: calculatePue(baseline.itPowerMw, baseline.coolingPowerMw),
    pueAfter: calculatePue(newItPowerMw, newCoolingPowerMw),
    wueBefore: calculateWue(baseline.waterUsageLiters, baseline.itPowerMw),
    wueAfter: calculateWue(newWaterUsageLiters, newItPowerMw),
    safety,
    recommended: safety.status === "safe",
  };
}
