# AI tools and model disclosure

Update this document before submission. Do not claim any tool or model that was
not actually used.

| Tool / model | Status | Claimed use |
| --- | --- | --- |
| OpenAI Codex | Used | Implementation, debugging, refactoring, and application verification. |
| Google Gemini API | Used in application | Qualitative explanations of structured findings; not the source of numerical metrics or control decisions. |
| `gemini-3.6-flash` | [confirm deployed value] | Model configured through `GEMINI_MODEL` for AI explanations. |
| Supabase PostgreSQL | Used | Storage for demo telemetry and simulation records, implemented during the build window. |
| Vercel | Used | Application deployment. |
| Anthropic Claude | Not claimed | Add only if actually used, with its specific role. |

## AI use in Coolara

- Telemetry, metrics, deviations, PUE, WUE, cost, and simulation results are
  calculated deterministically by the application.
- Gemini receives structured findings and produces qualitative explanations and
  recommendations only.
- AI does not control real infrastructure and must not invent measurements or
  savings claims.
- API keys are stored only in server/deployment environment variables, never in
  the repository.

## Pre-submission verification

- [ ] The provider badge on the Anomalies page shows `gemini` after analysis runs.
- [ ] Vercel Environment Variables include `GEMINI_API_KEY` and the correct model value.
- [ ] The deployed `GEMINI_MODEL` value is recorded in the table above.
- [ ] The tool/model list matches the team's actual usage.
