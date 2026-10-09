import { createHash } from 'node:crypto'
import { ZxcvbnFactory } from '@zxcvbn-ts/core'
import * as zxcvbnCommon from '@zxcvbn-ts/language-common'
import * as zxcvbnEn from '@zxcvbn-ts/language-en'

export type PasswordCheckResult = {
  /** true = found in a known breach, false = not found, null = the lookup failed. */
  breached: boolean | null
  /** 0 (very guessable) to 4 (very unguessable). */
  strength: 0 | 1 | 2 | 3 | 4
}

const PWNED_RANGE_URL = 'https://api.pwnedpasswords.com/range'
const TIMEOUT_MS = 2000

let estimator: ZxcvbnFactory | null = null

function getEstimator(): ZxcvbnFactory {
  estimator ??= new ZxcvbnFactory({
    translations: zxcvbnEn.translations,
    graphs: zxcvbnCommon.adjacencyGraphs,
    dictionary: { ...zxcvbnCommon.dictionary, ...zxcvbnEn.dictionary },
  })
  return estimator
}

// k-anonymity: only the first 5 hex characters of the SHA-1 hash leave this
// process. The service returns every suffix in that bucket and the comparison
// happens locally, so the password (and its full hash) is never transmitted.
async function isBreached(password: string): Promise<boolean | null> {
  try {
    const digest = createHash('sha1').update(password).digest('hex').toUpperCase()
    const prefix = digest.slice(0, 5)
    const suffix = digest.slice(5)
    const response = await fetch(`${PWNED_RANGE_URL}/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!response.ok) return null
    const body = await response.text()
    for (const line of body.split('\n')) {
      const [candidate, count] = line.trim().split(':')
      // Padding entries have a count of 0 and are not real matches.
      if (candidate === suffix && Number(count) > 0) return true
    }
    return false
  } catch {
    return null
  }
}

export async function checkPassword(password: string): Promise<PasswordCheckResult> {
  const [breached, strength] = await Promise.all([
    isBreached(password),
    Promise.resolve().then(() => getEstimator().check(password).score),
  ])
  return { breached, strength }
}
