import { describe, expect, it } from "vitest";
import { evaluateSafety } from "../safetyGate";
import { MAX_SAFE_SERVER_TEMPERATURE_C } from "../constants";

describe("evaluateSafety", () => {
  it("is safe at and below the threshold", () => {
    expect(evaluateSafety(MAX_SAFE_SERVER_TEMPERATURE_C).status).toBe("safe");
    expect(evaluateSafety(MAX_SAFE_SERVER_TEMPERATURE_C - 5).status).toBe("safe");
  });

  it("is unsafe and includes a reason above the threshold", () => {
    const result = evaluateSafety(MAX_SAFE_SERVER_TEMPERATURE_C + 0.1);
    expect(result.status).toBe("unsafe");
    expect(result.reason).toBeTruthy();
  });
});
