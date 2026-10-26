# AuthGuard

AuthGuard monitors the sign-in security of a web app and explains what it finds in plain language. A connected app sends events (logins, failed logins, signups, password checks, session activity) through a small SDK. AuthGuard runs fixed detection rules on those events, shows alerts in a console, emails the important ones, and can explain any alert with AI.

> **Werkstatt is a demo client, not a real product.**
> The woodworking school under `/werkstatt` is a fictional app. It exists only to have something for AuthGuard to monitor, and to show AuthGuard working on top of it. You can't book classes there, and it isn't a real business. Its accounts, notes and logins are demo data.

> **The databases are not running 24/7.**
> AuthGuard and Werkstatt each use a Supabase database that is paused after a period of inactivity (on Supabase's Free plan, after 7 days of low activity). While a database is paused, the login and signup pages say so ("Sign-in isn't available right now…") and nobody can sign in. Signed-in users are sent to the login page with the same message; their session is kept and works again once the database is back. This is not a bug in the app.
> **To try the demo, email Elise at [elise.hoimyr01630@laposte.net](mailto:elise.hoimyr01630@laposte.net)** and she will start the databases. You can email the same address with any other questions.

---

## Contents

- [What's in the repository](#whats-in-the-repository)
- [How it works](#how-it-works)
- [Pages and routes](#pages-and-routes)
- [Detection rules](#detection-rules)
- [Running it locally](#running-it-locally)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Connecting an app with the SDK](#connecting-an-app-with-the-sdk)
- [Privacy and security design](#privacy-and-security-design)
- [Known limitations](#known-limitations)
- [Project structure](#project-structure)

---

## What's in the repository

One Next.js app contains two separate products:

| | AuthGuard | Werkstatt (demo client) |
|---|---|---|
| What it is | The monitoring product: landing page, console, alerts, AI assistant | A fictional woodworking school with sign-up, login and a private notes page |
| URL paths | `/`, `/authguard/*`, `/api/authguard/*`, `/api/v1/events` | `/werkstatt/*` |
| Database | AuthGuard's own Supabase project | A **separate** Supabase project |
| Accounts | AuthGuard console accounts | Werkstatt customer accounts |
| Talks to the other product | Receives events on `POST /api/v1/events` | Only through the AuthGuard SDK (`lib/authguard-sdk`), over HTTP, like any outside app would |

The two products never share a database, a session cookie or a Supabase client. The only link between them is the event API.

Stack: Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Supabase (Auth and Postgres), Zod, the Vercel AI SDK with Google Gemini, and Resend for alert emails.

## How it works

```
 Werkstatt (demo client)                      AuthGuard
 ───────────────────────                      ─────────────────────────────────────────
 login / signup / page view
        │
        ▼
 AuthGuard SDK  ── POST /api/v1/events ──▶   Events API (x-authguard-key)
 (hashes email + IP,                           │  store event (service role)
  checks password locally)                     ▼
                                              after(): run detection rules
                                               │  new medium/high alert?
                                               ├─▶ authguard_notifications (bell)
                                               └─▶ email via Resend (optional)

                                              Console (/authguard)
                                               └─ alerts are recomputed from the
                                                  last 7 days of events on every load
```

1. **Werkstatt reports what happens.** On each login, signup and signed-in page view, Werkstatt's server calls the SDK. The SDK hashes the email and IP with a secret salt, scores the password locally (strength from 0 to 4, plus a breach check), and posts an event to AuthGuard. These calls run after the response is sent, have a 2-second timeout and ignore errors, so monitoring never slows down or breaks the login.
2. **AuthGuard stores and checks.** The Events API verifies the API key, rejects any `password`, `token`, `email` or `ip` field, and stores the event. It then re-runs the detection rules on related events and records a notification for each new medium or high alert. If email is configured, it sends an email.
3. **The console shows alerts.** Alerts are not stored: they are computed from the last 7 days of events each time the console loads. Each alert links to its evidence, and has "Explain" and "Report" buttons that call the AI.
4. **Pop-up explanations.** Underlined security terms (for example *session reuse* or *breached password*), event types, severity labels and the console's stat tiles and table headers open a short explanation when you hover over them or tap them. These texts are written in advance in `lib/authguard/glossary.ts`; no AI is involved.

## Pages and routes

**AuthGuard**

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page, with hover explanations on the feature cards |
| `/authguard/login`, `/authguard/signup` | Public | Console accounts (email and password; the Google button appears only if Google is enabled in AuthGuard's project) |
| `/authguard/auth/callback`, `/authguard/auth/confirm` | Public | OAuth / PKCE code exchange; email confirmation via `token_hash` |
| `/authguard` | Signed in | Stat tiles, alert list, latest 50 events (all with hover explanations) |
| `/authguard/alerts/[id]` | Owner | One alert: summary, evidence, AI explanation and report |
| `/authguard/sessions/[sessionId]` | Owner | Session claims (with AI "Explain" per claim) and timeline |
| `/authguard/assistant` | Owner | Chat about the current alerts and events |
| `POST /api/v1/events` | API key | Where the SDK sends events |
| `POST /api/authguard/{assistant,explain-alert,explain-field,report}` | Owner | AI endpoints used by the console |

"Owner" means an account whose confirmed email is listed in `AUTHGUARD_ADMIN_EMAILS`, or any confirmed account when `AUTHGUARD_DEMO_MODE=true`. Other signed-in accounts see "No apps connected yet".

**Werkstatt (demo client)**

| Route | Access | Purpose |
|---|---|---|
| `/werkstatt` | Public | Demo landing page with sample classes |
| `/werkstatt/login`, `/werkstatt/signup` | Public | Customer accounts; the Google button appears only if Google is enabled in Werkstatt's project |
| `/werkstatt/auth/callback`, `/werkstatt/auth/confirm` | Public | Code exchange and email confirmation |
| `/werkstatt/account` | Signed in | "My workshop notes": add and delete private notes (protected by RLS) |

## Detection rules

The rules are in `lib/detection/rules/`. Each one is a pure function from events to alerts.

| Rule | Fires when | Severity |
|---|---|---|
| `failed-login-burst` | 5 or more failed logins for one email hash within 10 minutes | Medium; **high** if a successful login follows |
| `session-reuse` | One session id seen from a different browser or operating system / only from a different network | **High** / low |
| `tampered-token` | A session cookie was present but failed verification | Medium |
| `breached-password` | A password used at signup or login appears in public breach data | High |
| `weak-password` | A password scored 0 or 1 out of 4 | Medium |
| `new-device-login` | A successful login from a user agent never seen before for that user | Low |

Only medium and high alerts create notifications and emails.

## Running it locally

Requirements: Node.js 20.9 or newer and pnpm (the repo pins `pnpm@12.3.4`). Next.js is pinned to 16.4.3, which contains the October 2026 security fixes.

```bash
pnpm install
# create .env.local with the variables from the table below
pnpm dev        # http://localhost:3000
```

Other commands: `pnpm build` and `pnpm start`. `next/font` downloads IBM Plex from Google Fonts during the build, so the build machine needs internet access.

At startup, `instrumentation.ts` checks the environment. In production, missing **core** variables stop the app; missing optional variables only turn off their feature and log a warning.

## Environment variables

| Variable | Required | Used for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Core** | AuthGuard's Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | **Core** | AuthGuard's project only: reads and writes the `authguard_*` tables. Never expose it to the browser |
| `AUTHGUARD_API_KEY` | **Core** (16+ characters) | Shared secret between the SDK and the Events API |
| `NEXT_PUBLIC_WERKSTATT_SUPABASE_URL`, `NEXT_PUBLIC_WERKSTATT_SUPABASE_ANON_KEY` | Werkstatt | Werkstatt's separate Supabase project |
| `IP_HASH_SALT` | Werkstatt SDK (16+ characters) | Salt for hashing emails and IPs |
| `AUTHGUARD_APP_ID` | Optional (default `werkstatt-demo`) | App id the SDK sends and the console owners own |
| `AUTHGUARD_ENDPOINT` | Optional | Events API URL for the SDK (default: same host + `/api/v1/events`) |
| `AUTHGUARD_ADMIN_EMAILS` | Console | Comma-separated emails that own the demo app |
| `AUTHGUARD_DEMO_MODE` | Optional | `true` gives every confirmed account access to the demo app, with AI limited to 30 requests per hour per account |
| `GOOGLE_GENERATIVE_AI_API_KEY`, `LLM_MODEL` | AI features | Gemini key; model defaults to `gemini-2.5-flash` |
| `RESEND_API_KEY`, `AUTHGUARD_ALERT_EMAIL` | Optional | Send alert emails; without them, notifications still appear in the console |
| `AUTHGUARD_PUBLIC_URL` | Optional | Base URL for links in emails |
| `SITE_URL` | Recommended in production | Public URL of the site, e.g. `https://authguard.example.com`. Used for auth redirects and email links instead of the request's `Host` / `X-Forwarded-Host` headers. Leave it unset locally and on preview deployments |

## Supabase setup

You need **two** Supabase projects.

**AuthGuard project.** Run these in the SQL editor:
1. `scripts/002_authguard.sql`: the events table.
2. `scripts/004_notifications.sql`: notifications.
3. `scripts/005_ai_usage.sql`: AI usage counter for demo mode.

**Werkstatt project.** Run `scripts/003_werkstatt_notes.sql` (the notes table with RLS).

**In both projects, under Authentication:**
- **URL configuration.** Set the Site URL and add the redirect URLs:
  - AuthGuard: `https://<your-domain>/authguard/auth/callback`
  - Werkstatt: `https://<your-domain>/werkstatt/auth/callback`
  - Add the `http://localhost:3000/...` versions for local development.
- **Email template ("Confirm signup").** To make confirmation links work in any browser, link to the confirm route:
  - AuthGuard: `{{ .SiteURL }}/authguard/auth/confirm?token_hash={{ .TokenHash }}&type=email`
  - Werkstatt: `{{ .SiteURL }}/werkstatt/auth/confirm?token_hash={{ .TokenHash }}&type=email`
- **Google (optional).** Enable the Google provider. Both products hide their Google button automatically when Google is off.

**Keeping the demo awake.** Supabase pauses Free-plan projects after 7 days of low activity, and a paused project has to be resumed from the Supabase dashboard ([Supabase docs](https://supabase.com/docs/guides/platform/free-project-pausing)). The two projects pause independently.

**What the app does while a project is asleep.** Every Supabase request has a 5-second limit, and each sign-in check gives up after 6 seconds, so pages never hang. The login and signup pages check the project first and show a message with the contact email instead of a generic error. A database that can't be reached is never reported to AuthGuard as a tampered token; only sessions that Supabase actually rejects are.

## Connecting an app with the SDK

Werkstatt shows the integration in `lib/authguard.ts`, `app/werkstatt/auth/actions.ts` and `app/werkstatt/account/layout.tsx`.

```ts
import { createAuthGuard } from '@/lib/authguard-sdk'

const guard = createAuthGuard({ endpoint, apiKey, appId, ipSalt })

await guard.trackLogin({ success, userId, email, request })   // after each login attempt
await guard.trackSignup({ userId, request })                  // after signup
const result = await guard.checkPassword(password)            // runs locally, the password is never sent
if (result) await guard.trackPasswordCheck({ userId, emailHash: guard.hashEmail(email), result, context: 'login' })
await guard.sessionSeen({ claims, request })                  // on signed-in page views (claims from a verified token)
await guard.tokenInvalid({ request })                         // when a session cookie fails verification
```

`request` is anything with `headers.get()`. The SDK reads `user-agent` and `x-forwarded-for` and sends only hashes.

## Privacy and security design

- **No raw personal data:** emails and IPs are stored only as salted SHA-256 hashes. Passwords and tokens never reach AuthGuard; the Events API rejects those fields.
- **Breach checks with k-anonymity:** only the first 5 characters of the password's SHA-1 hash are sent to Have I Been Pwned, with padding.
- **Separate projects:** the service role key belongs to AuthGuard's project only. Werkstatt uses the anon key, and Row Level Security limits each customer to their own notes.
- **Sessions are verified with Supabase:** `getUser()` checks sessions with Supabase Auth on every request (in `proxy.ts`); cookie contents are never trusted on their own.
- **Safe redirects:** after login, redirects stay inside the product's own path, so there are no open redirects.
- **No account enumeration:** login and signup answer the same way whether or not an account exists.
- **AI answers only from stored facts:** the AI sees only server-side facts and short hash prefixes. Report links come from an allow-list, and cited event ids that aren't in the evidence are removed.

## Known limitations

- **Demo databases sleep** (see the note at the top). While a database is asleep, nobody can sign in; the pages say so within a few seconds.
- **No app onboarding yet:** there is one demo app, one shared API key, and no self-service way to connect an app. The console doesn't separate data by app yet.
- **Alerts cover 7 days:** they're computed from the last 7 days of events (at most 2000 events), so older alerts and their links disappear.
- **Audit:** the audit, what was fixed and what is still open, is in [AUDIT.md](AUDIT.md).

## Project structure

```
app/
  page.tsx                  AuthGuard landing page
  authguard/                AuthGuard login, signup, auth callbacks and console (alerts, sessions, assistant)
  werkstatt/                Werkstatt demo client: landing, login, signup, account (notes)
  api/v1/events/            Events API used by the SDK
  api/authguard/            AI endpoints for the console
components/
  auth/                     Login and signup forms shared by both products
  authguard/                Console UI, including explain.tsx (the hover pop-up)
  dashboard/                Werkstatt notes UI
lib/
  authguard-sdk/            The SDK a monitored app uses
  authguard.ts              Werkstatt's SDK setup
  detection/                Detection engine and rules
  services/                 Console data, AI services, notifications, email
  werkstatt/                Werkstatt's signed-in customer (auth-context.ts)
  repositories/             Database access
  supabase/                 Supabase clients, session refresh, timeouts and outage detection, one folder per product
  ai/                       Gemini client and prompts
scripts/                    SQL for the two Supabase projects
proxy.ts                    Refreshes the session of whichever product is requested
```

## Contact

Questions, or want the demo databases started? Email **[elise.hoimyr01630@laposte.net](mailto:elise.hoimyr01630@laposte.net)**.
