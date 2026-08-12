import { describe, expect, it } from "vitest";
import { detectAnomalies } from "../anomaly";
import { buildScenario } from "../scenarios";

const NOW = new Date("2026-08-12T12:00:00.000Z");

function coolingFinding(scenarioId: Parameters<typeof buildScenario>[0]) {
  const scenario = buildScenario(scenarioId, NOW);
  const findings = detectAnomalies(scenario.current);
  return { scenario, findings, cooling: findings.find((f) => f.metric === "cooling_power") };
}

describe("detectAnomalies", () => {
  it("reports no anomalies for the normal scenario", () => {
    const scenario = buildScenario("normal", NOW);
    const findings = detectAnomalies(scenario.current);
    expect(findings).toHaveLength(0);
  });

  it("flags cooling-inefficiency as elevated cooling power with an inefficiency cause, not ambient", () => {
    const { cooling } = coolingFinding("cooling-inefficiency");
    expect(cooling).toBeDefined();
    expect(cooling!.deviationPercent).toBeGreaterThan(10);
    expect(cooling!.severity).not.toBe("normal");
    expect(cooling!.possibleCauses.join(" ")).toMatch(/inefficiency/i);
    expect(cooling!.possibleCauses.join(" ")).not.toMatch(/ambient/i);
  });

  it("flags environmental-stress with an elevated-ambient cause", () => {
    const { cooling, scenario } = coolingFinding("environmental-stress");
    expect(scenario.current.ambientTemperatureC).toBeGreaterThan(30);
    expect(cooling).toBeDefined();
    expect(cooling!.possibleCauses.join(" ")).toMatch(/ambient/i);
  });

  it("flags workload-spike with a high-workload cause", () => {
    const { cooling, scenario } = coolingFinding("workload-spike");
    expect(scenario.current.itLoadPercent).toBeGreaterThanOrEqual(85);
    expect(cooling).toBeDefined();
    expect(cooling!.possibleCauses.join(" ")).toMatch(/workload/i);
  });

  it("does not raise a cooling finding for unsafe-optimization's baseline (the risk only appears once simulated)", () => {
    const { cooling } = coolingFinding("unsafe-optimization");
    expect(cooling).toBeUndefined();
  });
});
