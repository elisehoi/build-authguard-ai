# AuthGuard / Werkstatt — App Audit

Audited on 2026-10-10 at commit `main` after merging `origin/main` (the merge applied cleanly, with no conflicts).
This is a code read only. **Nothing has been built or run**: there is no Node 20+ or pnpm on the audit machine, and
`next.config.mjs` has `ignoreBuildErrors: true`, so type errors would not stop a build either. Treat every point
below as "from reading the code", not "seen in a browser".

Products:
- **AuthGuard**: the monitoring product. It covers `/`, `/authguard/*` and `/api/authguard/*` and uses the AuthGuard Supabase project.
- **Werkstatt**: the demo client app under `/werkstatt/*`. It uses the Werkstatt Supabase project and reports to AuthGuard only through `lib/authguard-sdk` and `POST /api/v1/events`.

---

## Part 1 — Page-by-page summary

### AuthGuard

| Route | Access · Supabase | What it shows / what you can do | Links & buttons lead to | Confusing / broken / unfinished |
|---|---|---|---|---|
| `/` | Public · none (the proxy refreshes the AuthGuard session) | Landing page: headline, subline, three feature cards with hover explanations | "Sign in" and "Sign in to AuthGuard" → `/authguard/login`; "Create an account" → `/authguard/signup`; footer → `/werkstatt` | The tab title is correct, but the favicon, theme colour and other metadata come from the root layout, which is Werkstatt's. "Detects session theft" promises more than the heuristic can deliver (see 2.15). |
| `/authguard/login` | Public · AuthGuard | Email/password and Google login; an `?error=` banner | Success → `next` (only inside `/authguard`, default `/authguard`); "Create an account" → `/authguard/signup`; logo → `/` | The Google button always shows. If Google isn't enabled in the AuthGuard project, clicking it bounces back with an error (2.11). |
| `/authguard/signup` | Public · AuthGuard | Email/password and Google signup; "check your inbox" state | Success with auto-login → `/authguard`; confirmation email → `/authguard/auth/callback`; "Log in" → `/authguard/login` | Says "Free to start", but there is no pricing anywhere (2.19). It ignores `?error=`. |
| `/authguard/auth/callback` (GET) | Public · AuthGuard | Exchanges the OAuth or PKCE code | → `next` (inside `/authguard`), or `/authguard/login?error=` | Needs the URL listed in the AuthGuard project's Redirect URLs. |
| `/authguard/auth/confirm` (GET) | Public · AuthGuard | Verifies `token_hash` from the email | → `next`, or `/authguard/login?error=` | Only works if the AuthGuard email template points here. |
| `/authguard` | Logged in · AuthGuard (+ service role) | Owners: 4 stat tiles, alert list with "New" badges, latest 50 events. Others: "No apps connected yet" | Alert → `/authguard/alerts/[id]`; session id → `/authguard/sessions/[id]`; header bell → alert pages; "Log out" → `/authguard/login` | The "Events, last 7 days" count is capped at 2000. The empty state has no next step (2.6). |
| `/authguard/alerts/[id]` | Owner · AuthGuard (+ service role) | Alert title, summary, rule, evidence, AI explain/report buttons; marks the notification read | "All alerts" → `/authguard`; "open session" → session page; "Learn more" → external allow-listed URLs | Alerts older than 7 days return a 404. Their notifications then stay unread forever (2.4). The 404 page is Werkstatt-styled and leaves the console (2.8). |
| `/authguard/sessions/[sessionId]` | Owner · AuthGuard (+ service role) | Claim cards with AI "Explain", plus a timeline | "All alerts" → `/authguard` | The text says "in the last 7 days", but the query has no time window. The id is decoded twice, so a `%` in an id can throw (2.17). |
| `/authguard/assistant` | Owner · AuthGuard (+ service role) | Streaming AI chat over the last 7 days of alerts and events | Suggestion chips send questions | Needs an LLM key or Vercel OIDC. One suggestion ("Which sessions had a failed login burst?") doesn't fit the data (2.18). Non-owners see the empty state. |
| `POST /api/authguard/assistant` | Owner (401/403 JSON) · AuthGuard service role | Streams the chat answer | — | — |
| `POST /api/authguard/explain-alert` | Owner · AuthGuard service role | AI plain-language explanation | — | Returns 404 when the alert has aged out. |
| `POST /api/authguard/explain-field` | Owner · AuthGuard service role | AI explanation of one JWT claim | — | — |
| `POST /api/authguard/report` | Owner · AuthGuard service role | AI structured security report | — | — |
| `POST /api/v1/events` | API key (`x-authguard-key`) · AuthGuard service role | Stores an SDK event, dedupes `session_seen`, then (in `after()`) runs detection, records notifications and sends email | — | `test` is an accepted event type, but the SQL check constraint rejects it, giving a 502 (2.20). Email links use the request host (2.13). |

Shared, AuthGuard-only: `app/authguard/error.tsx` has "Try again" and "Back to the console".

### Werkstatt

| Route | Access · Supabase | What it shows / what you can do | Links & buttons lead to | Confusing / broken / unfinished |
|---|---|---|---|---|
| `/werkstatt` | Public · Werkstatt (session read) | Woodworking school landing page; 4 class cards | Logged out: "Log in" → `/werkstatt/login`, "Sign up" / "Sign up for classes" → `/werkstatt/signup`. Logged in: "My workshop notes" / "Open my notes" → `/werkstatt/account` | Classes can't be booked: the cards have no action, and signing up only gives you a notes page (2.16). |
| `/werkstatt/login` | Public · Werkstatt | Email/password login; Google only if the project has it enabled | Success → `next` (inside `/werkstatt`, default `/werkstatt/account`); "Create an account" → `/werkstatt/signup` | — |
| `/werkstatt/signup` | Public · Werkstatt | Signup form; "check your inbox" state | Auto-login → `/werkstatt/account`; email → `/werkstatt/auth/callback`; "Log in" → `/werkstatt/login` | Subtitle "You'll confirm your email before **the lab** opens" is left over from the old "token lab" (2.14). |
| `/werkstatt/auth/callback` (GET) | Public · Werkstatt | Code exchange; reports `login_success` to AuthGuard | → `next` or `/werkstatt/login?error=` (wording kept non-technical) | Needs the Werkstatt project's Redirect URLs. |
| `/werkstatt/auth/confirm` (GET) | Public · Werkstatt | `token_hash` verification | → `next` or `/werkstatt/login?error=` | Needs the Werkstatt email template. |
| `/werkstatt/account` | Logged in · Werkstatt (anon key + RLS) | "My workshop notes": add and delete notes. The layout reports `session_seen` and `token_invalid` to AuthGuard | Logo → `/werkstatt`; "Log out" → `/werkstatt/login` | The `token_invalid` report can never run (2.1). |

Shared root files used by both products: `app/not-found.tsx` ("Back to start" → `/`) and `app/error.tsx` ("My notes" → `/werkstatt/account`), see 2.8.

---

## Part 2 — Logic and consistency issues (most important first)

### Critical / high

**2.1 The "tampered token" rule can never trigger**
- Where: `proxy.ts` → `lib/supabase/werkstatt/middleware.ts`, and `app/werkstatt/account/layout.tsx`.
- What goes wrong: the proxy runs first. When the Werkstatt cookie fails verification, the proxy redirects to `/werkstatt/login` before the account layout runs. The layout's `guard.tokenInvalid(...)` branch is therefore unreachable, no `token_invalid` events are ever recorded, and the rule, its glossary entry and the "tampered token" claim on the home page describe something the demo can't produce.
- Fix: report `token_invalid` from the proxy when a Werkstatt auth cookie is present but `getUser()` fails, before redirecting.

**2.2 A failed-login burst that ends in a successful login never sends the "high" email**
- Where: `lib/services/notification-service.ts` and `lib/detection/rules/failed-login-burst-rule.ts`.
- What goes wrong: the burst alert's id doesn't change when a success follows, so the medium alert is recorded and emailed first. The later escalation to high (the guess may have worked) hits the existing row and is skipped. The bell also keeps showing "medium".
- Fix: store the highest severity, and send one extra email when a recorded alert escalates from medium to high.

**2.3 Session reuse will misfire in normal use (false high alerts plus emails)**
- Where: `lib/detection/rules/session-reuse-rule.ts`.
- What goes wrong: any change of hashed IP within one session counts. Wi-Fi to mobile, IPv6 privacy addresses, VPN toggles, or a browser update changing the user agent all raise a **high** "possible theft" alert and email the admin. A live demo on a phone is likely to trip it.
- Fix: require both the user agent and the network to change, or require overlapping activity, before rating it high; treat an IP-only change as low.

**2.4 Notifications for alerts older than 7 days can never be cleared**
- Where: `app/authguard/(console)/alerts/[id]/page.tsx`, `components/authguard/mark-read.tsx` and `notification-bell.tsx`.
- What goes wrong: alerts are recomputed from the last 7 days of events. Once an alert ages out, its page returns a 404, `MarkRead` never runs, and the bell count stays up permanently. There's no "mark all read".
- Fix: mark the notification read even when the alert is gone (or before `notFound()`), and add "Mark all as read" to the bell.

**2.5 A single missing env var takes the whole production site down**
- Where: `instrumentation.ts` → `validateAllEnv()`.
- What goes wrong: in production, any invalid group throws at boot. That includes `AUTHGUARD_ADMIN_EMAILS`, Werkstatt's SDK vars (`IP_HASH_SALT`, `AUTHGUARD_API_KEY`) and the Werkstatt Supabase vars. Both products become unavailable, even the ones that don't need the missing value.
- Fix: fail fast only for the core AuthGuard vars, and log the optional groups as warnings.

**2.6 "No apps connected yet" is a dead end**
- Where: `components/authguard/no-apps.tsx`.
- What goes wrong: it says your app "gets an app id and an API key", but there's no way to get one. There's no button, no settings page and no docs link, so every non-admin signup ends here.
- Fix: add a clear next step, such as "Contact us to connect an app" or a link to SDK docs; at minimum, link to the Werkstatt demo to show what it looks like.

### Medium

**2.7 A weak password produces a new medium alert and email every day the user logs in**
- Where: `lib/authguard.ts` (`reportAuthAttempt`) and `password-rules.ts`.
- What goes wrong: every successful login re-checks the password and sends a `password_check` event. Alerts are bucketed per day, so each daily login with the same weak password is a new alert id, which means a new notification and email. Breached passwords do the same at high severity.
- Fix: only check passwords at signup and password change, or bucket password alerts per user rather than per day.

**2.8 Root 404 and error pages mix up the products**
- Where: `app/not-found.tsx` and `app/error.tsx`.
- What goes wrong:
  - A Werkstatt 404 shows "Back to start" → `/`, which is AuthGuard's landing page.
  - An error on `/` (AuthGuard) offers "My notes" → `/werkstatt/account`.
  - Console `notFound()` (aged-out alert, unknown session) renders the Werkstatt-themed root 404 outside the console.
- Fix: add `app/werkstatt/not-found.tsx`, `app/werkstatt/error.tsx` and `app/authguard/not-found.tsx`, and make the root versions neutral.

**2.9 AuthGuard pages inherit Werkstatt metadata**
- Where: `app/layout.tsx`.
- What goes wrong: the default description ("Small-group woodworking classes…"), `themeColor` and the icons apply to `/authguard/*` too. A shared console link previews as a woodworking school.
- Fix: give `app/authguard/layout.tsx` and `app/page.tsx` their own `description`, `icons` and `themeColor`.

**2.10 Bucketed alert ids can change, or alerts can disappear, as data grows**
- Where: `lib/services/console-data.ts` (`listRecent` has a 2000-event cap and a 7-day window) and `buildAlert` (id = rule + subject + bucket of the first evidence event).
- What goes wrong: when older events fall out of the window or the cap, the first evidence event changes. The alert then gets a new id, so it re-notifies, and the old notification points to a 404.
- Fix: derive ids from the bucket of the triggering event rather than the first one in the window, and give ingestion and the console the same window logic.

**2.11 AuthGuard always shows Google sign-in**
- Where: `app/authguard/login/page.tsx` and `signup/page.tsx`.
- What goes wrong: if Google isn't configured in the AuthGuard project, the button leads to "Google sign-in is not available right now."
- Fix: reuse the `/auth/v1/settings` check that Werkstatt uses, or make sure Google is configured before the demo.

**2.12 Required SQL and project setup aren't enforced**
- Where: `scripts/`.
- What goes wrong:
  - Without `002_authguard.sql`, the Events API returns 502 and the SDK silently drops every event, so the console just looks empty.
  - Without `004_notifications.sql`, notifications fail silently: the console catches the error and the ingestion log shows `[notifications]`.
  - Without `003_werkstatt_notes.sql` in the Werkstatt project, the notes page crashes into `app/error.tsx`.
  - Redirect URLs and email templates must be set in both projects.
- Fix: add a setup checklist to the README and a status check (the planned `GET /api/v1/status`, which is already excluded in `proxy.ts`) that reports missing tables.

**2.13 Email links may point to the wrong host**
- Where: `app/api/v1/events/route.ts` (`getRequestOrigin`).
- What goes wrong: the alert URL in the email uses the host the SDK called. If `AUTHGUARD_ENDPOINT` is an internal URL (for example `http://localhost:3000`) or a preview deployment, the email button points there.
- Fix: add an `AUTHGUARD_PUBLIC_URL` env var and use it for links in emails.

### Low / polish

**2.14 Leftover "lab" wording on Werkstatt signup**
- Where: `app/werkstatt/signup/page.tsx`.
- What goes wrong: "You'll confirm your email before the lab opens" makes no sense for a woodworking school.
- Fix: "You'll confirm your email before your first class."

**2.15 AuthGuard wording promises more than it delivers**
- Where: `app/page.tsx` and `lib/authguard/glossary.ts`.
- What goes wrong:
  - "Detects session theft": it only detects user-agent or IP changes within a session, so theft from the same network and browser goes unseen.
  - The "Tampered token" glossary entry says the alert happens when someone edits or forges a token, but expired or revoked sessions would also look like that (once 2.1 is fixed).
  - "AuthGuard checks with k-anonymity": the check actually runs in the client app's SDK.
  - The "Password hashing" entry still addresses the reader as "Your password", copied from Werkstatt.
- Fix: say "Flags signs of session theft", "can mean edited, forged or expired", "The AuthGuard SDK checks…", and reword to "The user's password…".

**2.16 Werkstatt promises booking that doesn't exist**
- Where: `app/werkstatt/page.tsx` and the root `metadata.description` ("Book a bench").
- What goes wrong: "Sign up for classes" leads to a notes page, and the class cards have no action.
- Fix: rename to "Create an account" and add "Booking opens soon" to the cards, or drop "Book a bench".

**2.17 Session page inconsistencies**
- Where: `app/authguard/(console)/sessions/[sessionId]/page.tsx` and `listForSession`.
- What goes wrong: it says "events in the last 7 days" but loads all events (up to 500, no window, no `app_id` filter). It also calls `decodeURIComponent` on an id that is already decoded, so a `%` in an id throws and gives a 500.
- Fix: add the 7-day filter and drop the second decode.

**2.18 An assistant suggestion doesn't match the data**
- Where: `components/authguard/assistant-chat.tsx`.
- What goes wrong: "Which sessions had a failed login burst?" Failed logins have no session; bursts are grouped by email hash, so the AI will say it doesn't know.
- Fix: "Which accounts had a failed-login burst?"

**2.19 "Free to start" on AuthGuard signup**
- Where: `app/authguard/signup/page.tsx`.
- What goes wrong: it implies a paid plan that doesn't exist (the Stripe code was removed).
- Fix: "Create an account to connect your first app."

**2.20 `test` event type is accepted but can't be stored**
- Where: `lib/types.ts` (`EVENT_TYPES` includes `test`) and `scripts/002_authguard.sql` (the check constraint doesn't).
- What goes wrong: posting a `test` event returns 502 `upstream_error`.
- Fix: add `'test'` to the SQL check constraint, or remove it from `EVENT_TYPES`.

**2.21 Root error page is too technical for Werkstatt customers**
- Where: `app/error.tsx`.
- What goes wrong: "a missing configuration value" isn't customer language.
- Fix: "Something went wrong on our side. Please try again in a moment."

**2.22 References to routes that don't exist**
- Where: `lib/supabase/werkstatt/middleware.ts` (protects `/werkstatt/admin`), `proxy.ts` (excludes `api/v1/status`) and `lib/env.ts` (the `authguardApp` group is never read; its comment mentions a "status API").
- Fix: either build them or remove the references.

**2.23 Build artefacts are committed**
- Where: `tsconfig.tsbuildinfo` and `next-env.d.ts`. The latter imports `./.next/dev/types/*`, which only exists after `next dev`.
- Fix: `git rm --cached` both and add them to `.gitignore`.

**2.24 A Werkstatt-only helper has a generic name**
- Where: `lib/services/auth-context.ts` sits next to the AuthGuard `console-*` services but uses the Werkstatt Supabase client.
- What goes wrong: it's easy to import into AuthGuard by mistake, which would silently mix the two account systems. Nothing does today.
- Fix: move it to `lib/werkstatt/auth-context.ts`.

**2.25 The Werkstatt cookie rename logs existing users out once**
- Where: `lib/supabase/werkstatt/config.ts`.
- What goes wrong: sessions stored under the old `sb-<ref>-auth-token` name aren't read any more, and the old cookies linger in browsers.
- Fix: acceptable for a demo; mention it in the release notes.

### Checked and found OK
- **No mixing of account systems:** no Werkstatt file imports an AuthGuard Supabase client or `console-access`, and no AuthGuard file imports a Werkstatt client or `auth-context`. AuthGuard's only Werkstatt link is the home-page footer.
- **Werkstatt text:** no user-facing text mentions tokens, cookies, hashes, JWTs or other security mechanics. Only code comments do. "Your session expired" remains, which is ordinary UX wording.
- **`next` redirects:** limited to the product's own path prefix, with no open redirect.
- **Duplicate events:** `session_seen` is deduped for 5 minutes per client. Login, signup and password-check events are each sent once per action.
- **Notifications:** at most one row and one email per alert id, enforced by the primary key. Email sending is skipped silently without `RESEND_API_KEY` or `AUTHGUARD_ALERT_EMAIL`.
