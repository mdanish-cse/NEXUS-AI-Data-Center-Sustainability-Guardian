/** Thrown for malformed request input; routes map this to HTTP 400, everything else to 500. */
export class ValidationError extends Error {}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
