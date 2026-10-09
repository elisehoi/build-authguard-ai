import { z } from 'zod'

export const noteSchema = z.object({
  id: z.string(),
  content: z.string(),
  created_at: z.string(),
})
export type Note = z.infer<typeof noteSchema>

export const EVENT_TYPES = ['login_success', 'login_failed', 'signup', 'password_check', 'session_seen', 'token_invalid', 'test'] as const
export type EventType = (typeof EVENT_TYPES)[number]

export const authGuardEventSchema = z.object({
  id: z.string(),
  app_id: z.string(),
  event_type: z.enum(EVENT_TYPES),
  session_id: z.string().nullable(),
  user_ref: z.string().nullable(),
  email_hash: z.string().nullable(),
  user_agent: z.string().nullable(),
  ip_hash: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  occurred_at: z.string(),
  created_at: z.string(),
})
export type AuthGuardEvent = z.infer<typeof authGuardEventSchema>
