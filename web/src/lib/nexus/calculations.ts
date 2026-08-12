import {
  AMBIENT_SENSITIVITY_PER_C,
  BASELINE_SERVER_TEMPERATURE_C,
  COOLING_LOAD_FACTOR,
  REFERENCE_AMBIENT_C,
  SAMPLE_INTERVAL_HOURS,
  SERVER_TEMP_RISE_AT_FULL_DEFICIT_C,
} from "./constants";
import type { ComputedMetrics, Telemetry } from "./types";

/** Power Usage Effectiveness: total facility power / IT power. Lower is better; 1.0 is the theoretical floor. */
export function calculatePue(itPowerMw: number, coolingPowerMw: number): number {
  if (itPowerMw <= 0) return 0;
  return (itPowerMw + coolingPowerMw) / itPowerMw;
}

/** Water Usage Effectiveness: liters consumed per kWh of IT energy delivered. */
export function calculateWue(waterUsageLiters: number, itPowerMw: number): number {
  const itEnergyKwh = itPowerMw * 1000 * SAMPLE_INTERVAL_HOURS;
  if (itEnergyKwh <= 0) return 0;
  return waterUsageLiters / itEnergyKwh;
}

/**
 * Expected cooling power under a simple physical model: proportional to IT load,
 * scaled up when ambient temperature runs above the reference. This is the
 * anomaly-detection baseline — no historical averaging required.
 */
export function expectedCoolingPowerMw(itPowerMw: number, ambientTemperatureC: number): number {
  const ambientExcess = Math.max(0, ambientTemperatureC - REFERENCE_AMBIENT_C);
  const ambientMultiplier = 1 + AMBIENT_SENSITIVITY_PER_C * ambientExcess;
  return itPowerMw * COOLING_LOAD_FACTOR * ambientMultiplier;
}

export function deviationPercent(actual: number, expected: number): number {
  if (expected === 0) return actual === 0 ? 0 : 100;
  return ((actual - expected) / expected) * 100;
}

export function powerToEnergyMwh(powerMw: number, hours: number = SAMPLE_INTERVAL_HOURS): number {
  return powerMw * hours;
}

/**
 * Predicted server temperature from cooling adequacy alone: a shortfall between
 * what's delivered and what's required pushes temperature above baseline;
 * surplus cooling never pushes it below baseline (excess cooling is just waste,
 * not extra safety margin, for this simple MVP model).
 */
export function predictServerTemperatureC(providedCoolingMw: number, requiredCoolingMw: number): number {
  if (requiredCoolingMw <= 0) return BASELINE_SERVER_TEMPERATURE_C;
  const deficitRatio = Math.max(0, (requiredCoolingMw - providedCoolingMw) / requiredCoolingMw);
  return BASELINE_SERVER_TEMPERATURE_C + deficitRatio * SERVER_TEMP_RISE_AT_FULL_DEFICIT_C;
}

export function computeMetrics(t: Telemetry): ComputedMetrics {
  const expectedCoolingPower = expectedCoolingPowerMw(t.itPowerMw, t.ambientTemperatureC);
  return {
    totalPowerMw: t.itPowerMw + t.coolingPowerMw,
    pue: calculatePue(t.itPowerMw, t.coolingPowerMw),
    wue: calculateWue(t.waterUsageLiters, t.itPowerMw),
    expectedCoolingPowerMw: expectedCoolingPower,
    coolingDeviationPercent: deviationPercent(t.coolingPowerMw, expectedCoolingPower),
  };
}
