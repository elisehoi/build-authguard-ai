import 'server-only'
import { z } from 'zod'

export const tokenClaimsSchema = z.object({
  sub: z.string(),
  email: z.string().optional(),
  role: z.string().optional(),
  aud: z.union([z.string(), z.array(z.string())]).optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
  session_id: z.string().optional(),
  aal: z.string().optional(),
  amr: z.array(z.object({ method: z.string(), timestamp: z.number() })).optional(),
  app_metadata: z.object({ provider: z.string().optional() }).loose().optional(),
})
export type TokenClaims = z.infer<typeof tokenClaimsSchema>

const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const cookieSessionSchema = z.object({ access_token: z.string() }).loose()

function base64UrlDecode(segment: string): string {
  return Buffer.from(segment, 'base64url').toString('utf8')
}

function base64UrlEncode(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64url')
}

export class TokenService {
  // Decoding is NOT verification. A JWT payload is only base64, readable by
  // anyone holding the token. We decode purely to display it; Supabase does
  // the real signature check whenever the token is used.
  decode(token: string): TokenClaims {
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Not a JWT: expected three dot-separated parts.')
    let payload: unknown
    try {
      payload = JSON.parse(base64UrlDecode(parts[1]))
    } catch {
      throw new Error('The token payload is not valid base64 JSON.')
    }
    return tokenClaimsSchema.parse(payload)
  }

  // Accepts what a learner may paste: a raw JWT, or the sb-...-auth-token
  // cookie value (optionally "base64-" prefixed, optionally the .0 and .1
  // chunks pasted together, which simply concatenate back into one value).
  extractAccessToken(input: string): string {
    const value = input.trim().replace(/^"|"$/g, '')
    if (JWT_PATTERN.test(value)) return value

    const json = value.startsWith('base64-') ? Buffer.from(value.slice(7), 'base64').toString('utf8') : value
    try {
      const parsed = cookieSessionSchema.parse(JSON.parse(json))
      if (JWT_PATTERN.test(parsed.access_token)) return parsed.access_token
    } catch {
      // Fall through to the friendly error below.
    }
    throw new Error('Could not find an access token. Paste a JWT or the full auth cookie value.')
  }

  // Rewrites one claim but keeps the original signature. The signature was
  // computed over the original payload, so the server will reject this.
  tamper(token: string, changes: Record<string, string>): string {
    const [header, payload, signature] = token.split('.')
    const claims: Record<string, unknown> = JSON.parse(base64UrlDecode(payload))
    return [header, base64UrlEncode(JSON.stringify({ ...claims, ...changes })), signature].join('.')
  }
}

export const tokenService = new TokenService()
