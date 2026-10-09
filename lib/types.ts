import { z } from 'zod'

// Rows are parsed with zod instead of cast, so a schema drift in the database
// shows up as a clear error rather than as silently wrong data in the UI.

export const noteSchema = z.object({
  id: z.string(),
  content: z.string(),
  created_at: z.string(),
})
export type Note = z.infer<typeof noteSchema>

export const profileSchema = z.object({
  id: z.string(),
  is_pro: z.boolean(),
  created_at: z.string(),
})
export type Profile = z.infer<typeof profileSchema>

export const SESSION_EVENT_TYPES = ['login_success', 'login_failed', 'page_view', 'token_replay'] as const
export type SessionEventType = (typeof SESSION_EVENT_TYPES)[number]

export const sessionEventSchema = z.object({
  id: z.number(),
  user_id: z.string().nullable(),
  session_id: z.string().nullable(),
  event_type: z.enum(SESSION_EVENT_TYPES),
  user_agent: z.string().nullable(),
  ip_hash: z.string().nullable(),
  created_at: z.string(),
})
export type SessionEvent = z.infer<typeof sessionEventSchema>

export type NewSessionEvent = {
  userId: string | null
  sessionId: string | null
  eventType: SessionEventType
  userAgent: string | null
  ipHash: string | null
}
