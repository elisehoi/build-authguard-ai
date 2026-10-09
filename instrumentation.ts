export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { validateAllEnv } = await import('./lib/env')
  const { errors, warnings } = validateAllEnv()

  // Optional features (Werkstatt, its SDK, alert emails, admin list, AI) only
  // warn: each re-validates when used, so a gap disables that feature alone.
  if (warnings.length > 0) console.warn(`[env] ${warnings.join('\n[env] ')}`)
  if (errors.length === 0) return

  // Core AuthGuard variables: production fails fast so a misconfigured deploy
  // never serves traffic. Development only warns.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errors.join('\n'))
  }
  console.warn(`[env] ${errors.join('\n[env] ')}`)
}
