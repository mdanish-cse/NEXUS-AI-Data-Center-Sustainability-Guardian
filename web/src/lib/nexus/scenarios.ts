import { WATER_INTENSITY_L_PER_KWH, SAMPLE_INTERVAL_HOURS } from "./constants";
import { expectedCoolingPowerMw, predictServerTemperatureC } from "./calculations";
import type { Scenario, ScenarioId, Telemetry } from "./types";

export const DATA_CENTER_ID = "dc-batam-01";
const CAPACITY_MW = 4;
const HISTORY_LENGTH = 36; // 3 hours at 5-minute samples
const RAMP_LENGTH = 8; // last N points transition from normal into the scenario state

/** Deterministic seeded PRNG (mulberry32) — demo telemetry must be reproducible across reloads/tests. */
function mulberry32(seed: number) {
  let s = seed | 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform jitter in [-magnitude, +magnitude]. */
function jitter(rng: () => number, magnitude: number): number {
  return (rng() - 0.5) * 2 * magnitude;
}

interface Profile {
  itLoadPercent: number;
  ambientTemperatureC: number;
  /** Target (actual vs expected) cooling-power deviation, as a percent. 0 = perfectly matched. */
  coolingDeviationPercent: number;
  /** Optional observed server temperature for a synthetic equipment-fault scenario. */
  serverTemperatureC?: number;
}

const NORMAL_PROFILE: Profile = { itLoadPercent: 62, ambientTemperatureC: 26, coolingDeviationPercent: 0 };

const SCENARIO_PROFILES: Record<ScenarioId, { label: string; description: string; profile: Profile }> = {
  normal: {
    label: "Normal operation",
    description: "IT workload, cooling, and water usage all tracking their expected baselines.",
    profile: NORMAL_PROFILE,
  },
  "workload-spike": {
    label: "Workload spike",
    description: "High IT load raises power and cooling demand; cooling response lags slightly behind.",
    profile: { itLoadPercent: 92, ambientTemperatureC: 27, coolingDeviationPercent: 14 },
  },
  "cooling-inefficiency": {
    label: "Cooling inefficiency",
    description: "IT workload is moderate but cooling power is abnormally high for the load — wasted energy and water.",
    profile: { itLoadPercent: 60, ambientTemperatureC: 25, coolingDeviationPercent: 21 },
  },
  "environmental-stress": {
    label: "Environmental stress",
    description: "Elevated ambient temperature drives up expected cooling demand, and delivery lags the new baseline.",
    profile: { itLoadPercent: 64, ambientTemperatureC: 35, coolingDeviationPercent: 15 },
  },
  "unsafe-optimization": {
    label: "Unsafe optimization candidate",
    description:
      "High-load baseline for the What-if Simulator demo: cooling is already matched to requirement, so a meaningful cooling-setpoint increase pushes predicted server temperature past the safety threshold and gets rejected.",
    profile: { itLoadPercent: 88, ambientTemperatureC: 28, coolingDeviationPercent: 0 },
  },
  "critical-facility-stress": {
    label: "Critical facility stress",
    description:
      "Synthetic chiller-delivery fault: cooling equipment draws excess energy and water while server temperatures remain unsafe, demonstrating a critical reliability and sustainability incident.",
    profile: { itLoadPercent: 86, ambientTemperatureC: 34, coolingDeviationPercent: 55, serverTemperatureC: 35 },
  },
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function buildTelemetry(
  index: number,
  scenarioId: ScenarioId,
  timestamp: string,
  itLoadPercent: number,
  ambientTemperatureC: number,
  coolingDeviationPercent: number,
): Telemetry {
  const itPowerMw = (CAPACITY_MW * itLoadPercent) / 100;
  const expectedCooling = expectedCoolingPowerMw(itPowerMw, ambientTemperatureC);
  const coolingPowerMw = expectedCooling * (1 + coolingDeviationPercent / 100);
  const modeledServerTemperatureC = predictServerTemperatureC(coolingPowerMw, expectedCooling);
  const targetProfile = SCENARIO_PROFILES[scenarioId].profile;
  const serverTemperatureC = targetProfile.serverTemperatureC === undefined
    ? modeledServerTemperatureC
    : lerp(modeledServerTemperatureC, targetProfile.serverTemperatureC, Math.min(1, Math.max(0, index / (HISTORY_LENGTH - 1))));
  const coolingEnergyKwh = coolingPowerMw * 1000 * SAMPLE_INTERVAL_HOURS;
  const waterUsageLiters = coolingEnergyKwh * WATER_INTENSITY_L_PER_KWH;

  return {
    id: `${scenarioId}-${index}`,
    dataCenterId: DATA_CENTER_ID,
    timestamp,
    itLoadPercent: Number(itLoadPercent.toFixed(1)),
    itPowerMw: Number(itPowerMw.toFixed(3)),
    coolingPowerMw: Number(coolingPowerMw.toFixed(3)),
    ambientTemperatureC: Number(ambientTemperatureC.toFixed(1)),
    serverTemperatureC: Number(serverTemperatureC.toFixed(1)),
    waterUsageLiters: Number(waterUsageLiters.toFixed(1)),
  };
}

/**
 * Builds a synthetic scenario: a flat "normal" tail followed by a ramp into the
 * scenario's target profile, ending at `current`. Deterministic for a given
 * `now` + scenario id (seeded PRNG), so tests and reloads see stable data.
 */
export function buildScenario(id: ScenarioId, now: Date = new Date()): Scenario {
  const { label, description, profile: target } = SCENARIO_PROFILES[id];
  const rng = mulberry32(hashScenarioId(id));

  const history: Telemetry[] = [];
  for (let i = 0; i < HISTORY_LENGTH; i++) {
    const rampStart = HISTORY_LENGTH - 1 - RAMP_LENGTH;
    const t = Math.min(1, Math.max(0, (i - rampStart) / RAMP_LENGTH));

    const itLoadPercent = lerp(NORMAL_PROFILE.itLoadPercent, target.itLoadPercent, t) + jitter(rng, 1.5);
    const ambientTemperatureC =
      lerp(NORMAL_PROFILE.ambientTemperatureC, target.ambientTemperatureC, t) + jitter(rng, 0.4);
    const coolingDeviationPercent =
      lerp(NORMAL_PROFILE.coolingDeviationPercent, target.coolingDeviationPercent, t) + jitter(rng, 1.5);

    const minutesAgo = (HISTORY_LENGTH - 1 - i) * 5;
    const timestamp = new Date(now.getTime() - minutesAgo * 60_000).toISOString();

    history.push(buildTelemetry(i, id, timestamp, itLoadPercent, ambientTemperatureC, coolingDeviationPercent));
  }

  const current = history[history.length - 1];
  return { id, label, description, history, current };
}

function hashScenarioId(id: ScenarioId): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return hash;
}

export const SCENARIO_IDS: ScenarioId[] = [
  "normal",
  "workload-spike",
  "cooling-inefficiency",
  "environmental-stress",
  "unsafe-optimization",
  "critical-facility-stress",
];

export function isScenarioId(value: string): value is ScenarioId {
  return (SCENARIO_IDS as string[]).includes(value);
}
