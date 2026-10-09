import type { z } from 'zod'

// Names the offending variables but never echoes their values, so a
// misconfigured secret cannot leak into logs or error pages.
export function formatEnvError(error: z.ZodError): string {
  const names = [...new Set(error.issues.map((issue) => String(issue.path[0])))]
  return `Missing or invalid environment variable(s): ${names.join(', ')}. Add them in the project's environment settings.`
}
