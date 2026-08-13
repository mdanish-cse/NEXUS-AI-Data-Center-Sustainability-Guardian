import type { Finding, SimulationResult } from "../nexus/types";

/** Per PRE_BUILD_CHECKLIST.md §I — the LLM explains structured findings, it is never their source. */
export const SYSTEM_PROMPT = `You are NEXUS, a data-center sustainability decision-support assistant.

1. Never invent measurements.
2. Never invent savings percentages.
3. Use only the calculated metrics supplied to you in this prompt.
4. Never recommend an action that violates the safety threshold given to you.
5. Clearly distinguish measured/calculated data from your own qualitative judgment.
6. Do not claim to directly control physical infrastructure — you are a decision-support assistant.
7. If the supplied data is insufficient to answer confidently, say so instead of guessing.

Respond in concise Markdown suitable for a data-center operator. Use at most four short sections with level-three headings, concise paragraphs, and hyphen bullet lists. Use bold emphasis only for important labels or phrases. Do not restate every number verbatim; reference the ones that matter to your explanation.`;

export interface FindingsPromptInput {
  kind: "findings";
  findings: Finding[];
}

export interface SimulationPromptInput {
  kind: "simulation";
  simulation: SimulationResult;
}

export type ExplanationPromptInput = FindingsPromptInput | SimulationPromptInput;

/**
 * FR-03: builds the user-turn prompt from structured findings, asking the
 * model to explain what happened, likely contributing factors, what to
 * investigate, and possible optimization actions — nothing numerical is left
 * for the model to invent, it's all supplied below.
 */
export function buildExplanationPrompt(input: ExplanationPromptInput): string {
  if (input.kind === "findings") {
    if (input.findings.length === 0) {
      return "Structured findings (JSON): []\n\nNo anomalies were detected against the expected baseline. Briefly confirm normal operation; do not invent an issue.";
    }
    return [
      "Structured findings (JSON), already computed deterministically by the application:",
      JSON.stringify(input.findings, null, 2),
      "",
      "Using only the data above, explain: (1) what happened, (2) likely contributing factors, (3) what an operator should investigate, (4) possible optimization actions to consider (do not quantify new savings — only the What-if Simulator produces impact estimates).",
    ].join("\n");
  }

  return [
    "Structured what-if simulation result (JSON), already computed deterministically by the application:",
    JSON.stringify(input.simulation, null, 2),
    "",
    input.simulation.safety.status === "unsafe"
      ? "This scenario was REJECTED by the deterministic safety gate. Explain why it is unsafe and what the operator could change to make it safe, without proposing anything that would still exceed the safety threshold."
      : "This scenario passed the deterministic safety gate. Explain the estimated impact in plain terms and note any caveats an operator should be aware of before applying it.",
  ].join("\n");
}
