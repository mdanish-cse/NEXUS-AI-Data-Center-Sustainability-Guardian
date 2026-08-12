import { deviationPercent, expectedCoolingPowerMw } from "./calculations";
import {
  BASELINE_SERVER_TEMPERATURE_C,
  REFERENCE_AMBIENT_C,
  SAMPLE_INTERVAL_HOURS,
  SEVERITY_THRESHOLDS,
  WATER_INTENSITY_L_PER_KWH,
} from "./constants";
import type { Alert, Finding, Severity, Telemetry } from "./types";

/** Only over-consumption is flagged: less-than-expected cooling/water/temperature isn't a sustainability problem. */
function classifySeverity(signedDeviationPercent: number): Severity {
  const d = Math.max(0, signedDeviationPercent);
  if (d >= SEVERITY_THRESHOLDS.high) return "high";
  if (d >= SEVERITY_THRESHOLDS.medium) return "medium";
  if (d >= SEVERITY_THRESHOLDS.low) return "low";
  return "normal";
}

function coolingCauses(t: Telemetry, ambientExcessC: number): string[] {
  const causes: string[] = [];
  if (ambientExcessC >= 5) {
    causes.push(
      `Elevated ambient temperature (${t.ambientTemperatureC.toFixed(1)}°C, ${ambientExcessC.toFixed(1)}°C above the ${REFERENCE_AMBIENT_C}°C reference) increasing cooling load.`,
    );
  }
  if (t.itLoadPercent >= 85) {
    causes.push("High IT workload driving higher cooling demand.");
  }
  if (causes.length === 0) {
    causes.push(
      "Possible cooling system inefficiency (fouled filters, refrigerant loss, or setpoint drift) — cooling power exceeds what the current load requires.",
    );
  }
  return causes;
}

/**
 * FR-02: compares current telemetry against the deterministic expected baseline
 * and returns one Finding per metric whose over-consumption deviation clears
 * the "low" severity threshold. No history/ML required for the MVP baseline.
 */
export function detectAnomalies(t: Telemetry): Finding[] {
  const findings: Finding[] = [];
  const ambientExcessC = Math.max(0, t.ambientTemperatureC - REFERENCE_AMBIENT_C);
  const expectedCooling = expectedCoolingPowerMw(t.itPowerMw, t.ambientTemperatureC);
  const coolingDeviation = deviationPercent(t.coolingPowerMw, expectedCooling);

  if (classifySeverity(coolingDeviation) !== "normal") {
    findings.push({
      id: `${t.id}-cooling_power`,
      timestamp: t.timestamp,
      metric: "cooling_power",
      actualValue: t.coolingPowerMw,
      expectedValue: expectedCooling,
      deviationPercent: coolingDeviation,
      severity: classifySeverity(coolingDeviation),
      message: `Cooling power is ${coolingDeviation.toFixed(1)}% above the expected ${expectedCooling.toFixed(2)} MW baseline for the current load and ambient conditions.`,
      possibleCauses: coolingCauses(t, ambientExcessC),
    });
  }

  const expectedCoolingEnergyKwh = expectedCooling * 1000 * SAMPLE_INTERVAL_HOURS;
  const expectedWaterUsageLiters = expectedCoolingEnergyKwh * WATER_INTENSITY_L_PER_KWH;
  const waterDeviation = deviationPercent(t.waterUsageLiters, expectedWaterUsageLiters);

  if (classifySeverity(waterDeviation) !== "normal") {
    findings.push({
      id: `${t.id}-water_usage`,
      timestamp: t.timestamp,
      metric: "water_usage",
      actualValue: t.waterUsageLiters,
      expectedValue: expectedWaterUsageLiters,
      deviationPercent: waterDeviation,
      severity: classifySeverity(waterDeviation),
      message: `Water usage is ${waterDeviation.toFixed(1)}% above the expected ${expectedWaterUsageLiters.toFixed(0)} L baseline — water usage tracks cooling energy, so this typically shares its cause with the cooling power finding.`,
      possibleCauses: coolingCauses(t, ambientExcessC),
    });
  }

  const serverTempDeviation = deviationPercent(t.serverTemperatureC, BASELINE_SERVER_TEMPERATURE_C);
  if (classifySeverity(serverTempDeviation) !== "normal") {
    findings.push({
      id: `${t.id}-server_temperature`,
      timestamp: t.timestamp,
      metric: "server_temperature",
      actualValue: t.serverTemperatureC,
      expectedValue: BASELINE_SERVER_TEMPERATURE_C,
      deviationPercent: serverTempDeviation,
      severity: classifySeverity(serverTempDeviation),
      message: `Server temperature (${t.serverTemperatureC.toFixed(1)}°C) is ${serverTempDeviation.toFixed(1)}% above the ${BASELINE_SERVER_TEMPERATURE_C}°C fully-cooled baseline.`,
      possibleCauses: [
        "Delivered cooling power is below what current load and ambient conditions require — verify chillers/CRAC units are meeting setpoint.",
        "Sustained operation at this temperature increases hardware reliability risk.",
      ],
    });
  }

  return findings;
}

export function findingToAlert(finding: Finding): Alert {
  return {
    id: finding.id,
    timestamp: finding.timestamp,
    type: finding.metric,
    severity: finding.severity,
    metric: finding.metric,
    actualValue: finding.actualValue,
    expectedValue: finding.expectedValue,
    message: finding.message,
  };
}
