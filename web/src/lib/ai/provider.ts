import { SYSTEM_PROMPT, buildExplanationPrompt, type ExplanationPromptInput } from "./prompt";

export interface AIProvider {
  name: string;
  explain(input: ExplanationPromptInput): Promise<string>;
}

const STUB_DISCLAIMER =
  "(Stub explanation — no AI provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY in web/.env.local for a narrative AI explanation.)";

/**
 * Deterministic, template-based explanation with no external call. This is
 * the default provider so /api/explain works with zero setup, and it never
 * invents a number that wasn't already in the structured input.
 */
export const stubProvider: AIProvider = {
  name: "stub",
  async explain(input: ExplanationPromptInput): Promise<string> {
    if (input.kind === "findings") {
      if (input.findings.length === 0) {
        return `Telemetry is tracking its expected baseline; no anomalies detected. ${STUB_DISCLAIMER}`;
      }
      const lines = input.findings.map((f) => {
        const direction = f.deviationPercent >= 0 ? "above" : "below";
        return `- [${f.severity.toUpperCase()}] ${f.metric.replace("_", " ")}: ${f.actualValue.toFixed(2)} vs expected ${f.expectedValue.toFixed(2)} (${Math.abs(f.deviationPercent).toFixed(1)}% ${direction}). Likely cause: ${f.possibleCauses[0]}`;
      });
      return [
        `${input.findings.length} finding(s) detected against the expected baseline:`,
        ...lines,
        "Investigate the highest-severity metric first; use the What-if Simulator to quantify possible corrective actions.",
        STUB_DISCLAIMER,
      ].join("\n");
    }

    const s = input.simulation;
    if (s.safety.status === "unsafe") {
      return `This scenario was rejected: ${s.safety.reason} Reduce the requested change (e.g. a smaller cooling setpoint increase) and re-run the simulation. ${STUB_DISCLAIMER}`;
    }
    return [
      `This scenario passed the safety gate (predicted server temperature ${s.safety.predictedServerTemperatureC.toFixed(1)}°C, threshold ${s.safety.maxSafeServerTemperatureC}°C).`,
      `Estimated impact: ${s.energyDeltaMwh >= 0 ? "+" : ""}${s.energyDeltaMwh.toFixed(3)} MWh/hr energy, ${s.waterDeltaLiters >= 0 ? "+" : ""}${s.waterDeltaLiters.toFixed(0)} L/hr water, ${s.estimatedCostDeltaUsd >= 0 ? "+" : ""}$${s.estimatedCostDeltaUsd.toFixed(2)}/hr cost, PUE ${s.pueBefore.toFixed(2)} → ${s.pueAfter.toFixed(2)}.`,
      "These are simulation estimates, not guaranteed real-world savings.",
      STUB_DISCLAIMER,
    ].join("\n");
  },
};

async function callOpenAI(userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI request failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI response did not contain explanation text.");
  return text;
}

export const openaiProvider: AIProvider = {
  name: "openai",
  async explain(input: ExplanationPromptInput): Promise<string> {
    return callOpenAI(buildExplanationPrompt(input));
  },
};

async function callGemini(userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Gemini request failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini response did not contain explanation text.");
  return text;
}

export const geminiProvider: AIProvider = {
  name: "gemini",
  async explain(input: ExplanationPromptInput): Promise<string> {
    return callGemini(buildExplanationPrompt(input));
  },
};

/** Picks a provider by which API key is present. Defaults to the zero-setup stub. */
export function getAIProvider(): AIProvider {
  if (process.env.OPENAI_API_KEY) return openaiProvider;
  if (process.env.GEMINI_API_KEY) return geminiProvider;
  return stubProvider;
}
