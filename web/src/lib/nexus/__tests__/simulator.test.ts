import { describe, expect, it } from "vitest";
import { runSimulation } from "../simulator";
import { buildScenario } from "../scenarios";

const NOW = new Date("2026-08-12T12:00:00.000Z");

describe("runSimulation", () => {
  it("rejects a cooling setpoint increase that pushes the unsafe-optimization baseline over the safety threshold", () => {
    const { current } = buildScenario("unsafe-optimization", NOW);
    const result = runSimulation(current, { coolingSetpointDeltaC: 3 });

    expect(result.safety.status).toBe("unsafe");
    expect(result.recommended).toBe(false);
    expect(result.safety.reason).toBeTruthy();
  });

  it("accepts a small cooling setpoint increase on the same baseline", () => {
    const { current } = buildScenario("unsafe-optimization", NOW);
    const result = runSimulation(current, { coolingSetpointDeltaC: 1 });

    expect(result.safety.status).toBe("safe");
    expect(result.recommended).toBe(true);
  });

  it("keeps a workload-only change safe when cooling isn't reduced (cooling scales with the new load automatically)", () => {
    const { current } = buildScenario("normal", NOW);
    const result = runSimulation(current, { itWorkloadDeltaPercent: 20 });

    expect(result.safety.status).toBe("safe");
    expect(result.simulatedEnergyMwh).toBeGreaterThan(result.baselineEnergyMwh);
  });

  it("estimates a positive cost delta when energy usage increases", () => {
    const { current } = buildScenario("normal", NOW);
    const result = runSimulation(current, { itWorkloadDeltaPercent: 20 });

    expect(result.energyDeltaMwh).toBeGreaterThan(0);
    expect(result.estimatedCostDeltaUsd).toBeGreaterThan(0);
  });

  it("estimates a negative energy/cost delta for a reduced workload", () => {
    const { current } = buildScenario("normal", NOW);
    const result = runSimulation(current, { itWorkloadDeltaPercent: -20 });

    expect(result.energyDeltaMwh).toBeLessThan(0);
    expect(result.estimatedCostDeltaUsd).toBeLessThan(0);
  });
});
