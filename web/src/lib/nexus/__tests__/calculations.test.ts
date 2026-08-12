import { describe, expect, it } from "vitest";
import {
  calculatePue,
  calculateWue,
  deviationPercent,
  expectedCoolingPowerMw,
  predictServerTemperatureC,
} from "../calculations";
import { BASELINE_SERVER_TEMPERATURE_C, REFERENCE_AMBIENT_C } from "../constants";

describe("calculatePue", () => {
  it("is 1.0 when there is no cooling overhead", () => {
    expect(calculatePue(2, 0)).toBe(1);
  });

  it("rises as cooling power grows relative to IT power", () => {
    expect(calculatePue(2, 1)).toBeCloseTo(1.5, 5);
  });

  it("returns 0 for zero/invalid IT power instead of dividing by zero", () => {
    expect(calculatePue(0, 1)).toBe(0);
  });
});

describe("calculateWue", () => {
  it("is 0 when there is no water usage", () => {
    expect(calculateWue(0, 2)).toBe(0);
  });

  it("scales with water usage per IT energy delivered", () => {
    // itPowerMw=2 over a 5-minute sample => itEnergyKwh = 2*1000*(5/60) ≈ 166.67 kWh
    expect(calculateWue(166.666, 2)).toBeCloseTo(1, 3);
  });
});

describe("expectedCoolingPowerMw", () => {
  it("matches the nominal cooling-load factor at the reference ambient temperature", () => {
    expect(expectedCoolingPowerMw(4, REFERENCE_AMBIENT_C)).toBeCloseTo(2, 5); // COOLING_LOAD_FACTOR = 0.5
  });

  it("increases with ambient temperature above the reference", () => {
    const atReference = expectedCoolingPowerMw(4, REFERENCE_AMBIENT_C);
    const above = expectedCoolingPowerMw(4, REFERENCE_AMBIENT_C + 10);
    expect(above).toBeGreaterThan(atReference);
  });

  it("does not reward ambient temperature below the reference", () => {
    const atReference = expectedCoolingPowerMw(4, REFERENCE_AMBIENT_C);
    const below = expectedCoolingPowerMw(4, REFERENCE_AMBIENT_C - 10);
    expect(below).toBeCloseTo(atReference, 5);
  });
});

describe("deviationPercent", () => {
  it("is positive when actual exceeds expected", () => {
    expect(deviationPercent(1.82, 1.51)).toBeCloseTo(20.53, 1);
  });

  it("is 0 when actual equals expected", () => {
    expect(deviationPercent(5, 5)).toBe(0);
  });

  it("treats a nonzero actual against a zero expected as a full deviation", () => {
    expect(deviationPercent(5, 0)).toBe(100);
  });
});

describe("predictServerTemperatureC", () => {
  it("stays at baseline when delivered cooling meets or exceeds what's required", () => {
    expect(predictServerTemperatureC(2, 2)).toBe(BASELINE_SERVER_TEMPERATURE_C);
    expect(predictServerTemperatureC(3, 2)).toBe(BASELINE_SERVER_TEMPERATURE_C);
  });

  it("rises above baseline proportionally to the cooling shortfall", () => {
    const halfDeficit = predictServerTemperatureC(1, 2); // 50% shortfall
    expect(halfDeficit).toBeGreaterThan(BASELINE_SERVER_TEMPERATURE_C);

    const fullDeficit = predictServerTemperatureC(0, 2); // 100% shortfall
    expect(fullDeficit).toBeGreaterThan(halfDeficit);
  });
});
