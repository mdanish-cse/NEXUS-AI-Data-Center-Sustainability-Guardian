/**
 * MVP calculation assumptions. Not measured constants — tune these to fit the
 * demo story. Every deterministic formula in `calculations.ts`, `anomaly.ts`,
 * `simulator.ts`, and `safetyGate.ts` pulls from here so the whole model can
 * be retuned from one place.
 */

/** Telemetry sampling interval, used to convert instantaneous power (MW) into energy (MWh). */
export const SAMPLE_INTERVAL_HOURS = 5 / 60; // 5-minute samples

/** Cooling power under nominal conditions, as a fraction of IT power (drives expected PUE ~1.5). */
export const COOLING_LOAD_FACTOR = 0.5;

/** Ambient temperature (°C) above which cooling demand starts climbing. */
export const REFERENCE_AMBIENT_C = 25;

/** Fractional increase in expected cooling power per °C of ambient temperature above the reference. */
export const AMBIENT_SENSITIVITY_PER_C = 0.03;

/** Water drawn per unit of cooling energy (evaporative cooling towers, typical WUE-driving ratio). */
export const WATER_INTENSITY_L_PER_KWH = 1.8;

/** Deviation-percent thresholds for anomaly severity classification. */
export const SEVERITY_THRESHOLDS: Record<Exclude<import("./types").Severity, "normal">, number> = {
  low: 10,
  medium: 20,
  high: 35,
};

/**
 * Baseline (fully-cooled) server temperature, and how far it would rise if
 * delivered cooling fell to zero against what's required (deficitRatio = 1.0).
 * Server temp is only ever pushed above baseline by a cooling *shortfall* —
 * surplus cooling doesn't cool further, it's just wasted energy/water.
 */
export const BASELINE_SERVER_TEMPERATURE_C = 24;
export const SERVER_TEMP_RISE_AT_FULL_DEFICIT_C = 40;

/** Safety gate: reject any simulated scenario predicted to exceed this server temperature. */
export const MAX_SAFE_SERVER_TEMPERATURE_C = 32;

/** Fractional reduction in delivered cooling power per °C the cooling setpoint is raised (warmer setpoint = less cooling). */
export const COOLING_SETPOINT_SENSITIVITY_PER_C = 0.08;

/** Clamp for the simulator's IT workload delta so a single what-if run can't request an unrealistic load. */
export const MIN_IT_LOAD_PERCENT = 5;
export const MAX_IT_LOAD_PERCENT = 100;

/** Cost assumptions for simulator estimated-impact figures. */
export const ENERGY_COST_USD_PER_MWH = 140;
export const WATER_COST_USD_PER_LITER = 0.003;
