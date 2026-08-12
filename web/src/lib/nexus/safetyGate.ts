import { MAX_SAFE_SERVER_TEMPERATURE_C } from "./constants";
import type { SafetyResult } from "./types";

/**
 * FR-05: deterministic thermal/reliability threshold check. Any simulated
 * scenario predicted to exceed the configured server temperature is rejected
 * — this decision is never delegated to the LLM.
 */
export function evaluateSafety(predictedServerTemperatureC: number): SafetyResult {
  const status = predictedServerTemperatureC > MAX_SAFE_SERVER_TEMPERATURE_C ? "unsafe" : "safe";
  return {
    status,
    predictedServerTemperatureC,
    maxSafeServerTemperatureC: MAX_SAFE_SERVER_TEMPERATURE_C,
    reason:
      status === "unsafe"
        ? `Predicted server temperature ${predictedServerTemperatureC.toFixed(1)}°C exceeds the ${MAX_SAFE_SERVER_TEMPERATURE_C}°C safety threshold.`
        : undefined,
  };
}
