export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { validateAllEnv } = await import('./lib/env')
  const problems = validateAllEnv()
  if (problems.length === 0) return

  // Production fails fast so a misconfigured deploy never serves traffic.
  // Development only warns, so you can still explore features whose
  // variables are already set; each feature re-validates when used.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(problems.join('\n'))
  }
  console.warn(`[env] ${problems.join('\n[env] ')}`)
}
