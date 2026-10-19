# AuthGuard / Werkstatt — Audit

Audited on **2026-10-19** at commit `0984197` (`main`). This replaces the audit of 2026-10-10; the status of its items is in Part 5.

## How this audit was done

Unlike the previous audit, this one ran the code instead of only reading it:

- `pnpm install --frozen-lockfile` and `tsc --noEmit` (passes with no errors).
- `next dev`, plus a headless Chromium (Playwright) to hover, tap and submit forms.
- Supabase was **simulated as unavailable** in two ways: a port that refuses connections, and a server that accepts connections but never answers.
- `pnpm audit --prod`.

Limits:
- **No real Supabase project was used.** Nothing below was tested against the live databases, the Supabase dashboard settings (redirect URLs, email templates, Google provider) or the deployed site.
- **`next build` could not be run here**, because the audit machine can't reach Google Fonts and `next/font` fails the production build without it. That is a limit of the audit machine, not a bug in the repo. `next.config.mjs` still has `ignoreBuildErrors: true`, so type errors would not stop a build; the typecheck above passes anyway.
- The console pages (`/authguard/*` after login) were read, not run, because they need a working database.

Severity: **High** = breaks or badly degrades the demo; **Medium** = visible problem or real risk; **Low** = polish or hardening.

---

## Summary

1. **Sign-in hangs instead of failing when a database is slow or not answering** (1.1). With the Werkstatt database not answering, `/werkstatt/login` and every page of a signed-in user waited **more than 70 seconds** before the test gave up. Nothing in the code puts a time limit on Supabase calls.
2. **A sleeping database looks like an attack** (1.2). When the Werkstatt database can't be reached, a signed-in user is logged out *and* AuthGuard receives a `token_invalid` event, which becomes a medium "Invalid or tampered token presented" alert, with an email if email alerts are configured.
3. **The error message doesn't say what happened** (1.3). Both login forms answer "Something went wrong while signing in" when the database is down.
4. **Every page view makes two round trips to Supabase Auth** (1.4), which adds latency on every navigation even when everything is up.
5. **The hover pop-up works where it is used**, but the first console page after login has almost none (2.1, 2.2). On the landing page all 7 terms opened on hover and on tap, with no console errors.
6. **Security**: no critical issues found. The main hardening gaps are missing security headers (3.1) and the single shared API key / unscoped reads (3.2).

---

## Part 1 — Sign-in

### 1.1 No timeout on any Supabase request — High
- **Where:**
  - `lib/supabase/refresh-session.ts:39-41`: `getUser()` in the proxy, which runs on every matched request.
  - `lib/supabase/werkstatt/google.ts:10`: the Google check on the Werkstatt login and signup pages.
  - `lib/supabase/werkstatt/server.ts` and `lib/supabase/authguard/server.ts`: every server-side call, including `signInWithPassword` in `lib/auth/flows.ts:49`.
- **What goes wrong:** if Supabase accepts the connection but answers slowly or not at all, the request waits indefinitely.
- **Measured, with the Werkstatt database not answering:**

  | Request | Result |
  |---|---|
  | `GET /werkstatt/login` (logged out) | no response after 70 s |
  | `GET /werkstatt` (signed in) | no response after 70 s |
  | `GET /werkstatt/account` (signed in) | no response after 70 s |
  | `GET /authguard/login` | 200 in 1.6 s (it makes no Supabase call when logged out) |

- **Caveat:** I could not check how a *paused* Supabase project answers (fast error or slow), and Supabase's docs don't say. A slow region, a project that is resuming, or a Supabase incident all hit this path either way.
- **Fix:** give every Supabase client a fetch with a time limit, and add a signal to the Google check:
  ```ts
  // createServerClient(url, key, { ..., global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }) } })
  // google.ts: fetch(..., { ..., signal: AbortSignal.timeout(3000) })
  ```
  **Verified:** with this change applied temporarily, the same requests returned in 3 s (`/werkstatt/login`), 5 s (`/werkstatt/account`, redirect to login) and 10 s (`/werkstatt`, two timed-out calls in a row, see 1.4). The change typechecks. It was reverted afterwards and is not part of this commit.

### 1.2 A database outage is treated as a forged token — High
- **Where:** `lib/supabase/refresh-session.ts:39-50` and `lib/supabase/werkstatt/middleware.ts:25-29`.
- **What goes wrong:** the proxy only looks at whether `getUser()` returned a user, not at *why* it didn't. A network error, a timeout or a paused project are handled exactly like a rejected token:
  1. The user is redirected to `/werkstatt/login`, even though their session may be valid.
  2. If a Werkstatt auth cookie is present, `guard.tokenInvalid()` is sent to AuthGuard.
- **Measured:** with the Werkstatt database refusing connections, `GET /werkstatt/account` with a session cookie returned a 307 to the login page in 0.01 s, and the dev log showed one `POST /api/v1/events` for that request.
- **Why it matters here:** AuthGuard and Werkstatt use **two separate Supabase projects**, and each pauses on its own. If Werkstatt's project is asleep and AuthGuard's isn't, every signed-in visit produces a "tampered token" alert and email, which is exactly the false alarm the demo is meant to avoid.
- **Fix:** read `error` from `getUser()`. Report `token_invalid` and redirect only for a real auth rejection (an `AuthApiError` with a 4xx status). For network errors, timeouts and 5xx, pass the request through and let the page show a "service is waking up" message.

### 1.3 The login forms give a generic error when the database is down — Medium
- **Where:** `lib/auth/flows.ts:63-64` (login) and `:89-90` (signup).
- **Measured:** with the databases refusing connections, both `/authguard/login` and `/werkstatt/login` showed "Something went wrong while signing in. Please try again." within 0.2 s. A visitor can't tell this apart from a bug.
- **Fix:** when the error has status 0 or 5xx (supabase-js reports network failures as `AuthRetryableFetchError`), show something like "The demo database is asleep. Please contact the author to start it." and link to the README.

### 1.4 Two Supabase Auth round trips per page view — Medium
- **Where:** the proxy calls `getUser()` (`refresh-session.ts:41`), then the page calls it again through `getAuthContext()` (Werkstatt, `lib/services/auth-context.ts:44`) or `getConsoleAccess()` (AuthGuard, `lib/services/console-access.ts:38`). React's `cache()` dedupes calls within one render, but not between the proxy and the render.
- **Evidence:** with timeouts applied (1.1), `/werkstatt` with a cookie took 10 s, which is two 5 s timeouts back to back.
- **Effect:** each navigation pays the network distance to Supabase twice. In production, `<Link>` prefetches also pass through the proxy, which adds more calls. If the hosting region and the Supabase region are far apart, logins and page changes feel slow. I could not see which regions are used.
- **Fix (pick one):**
  - Keep `getUser()` in the proxy and use `supabase.auth.getClaims()` in pages; the installed `@supabase/auth-js` 2.117.3 has it. Note that `getClaims()` only verifies locally with asymmetric JWT signing keys, so check the project's JWT settings first.
  - Or deploy the functions in the same region as the Supabase projects.

### 1.5 Email confirmation depends on dashboard settings that the code can't check — Medium
- **Where:** signup passes `emailRedirectTo = <origin>/…/auth/callback` (`app/werkstatt/auth/actions.ts:30`, `app/authguard/auth/actions.ts:24`). The callbacks exchange a PKCE `code` (`callback/route.ts`), which only works in the browser that started the signup.
- **What goes wrong:** if the Supabase email template is still the default one, a confirmation link opened in another browser or device (a phone's mail app, for example) fails the code exchange. Werkstatt then says "This sign-in link has expired or was already used. Please log in again." As I understand Supabase's PKCE flow, the address is usually confirmed at that point anyway, so the message is misleading.
- **Fix:** point both email templates at the existing `/…/auth/confirm?token_hash={{ .TokenHash }}&type=email` routes. They work in any browser. Alternatively, change the callback failure text to "If you just confirmed your email, please log in."
- **Caveat:** I can't see the dashboard templates, so this may already be configured correctly.

### 1.6 AuthGuard always shows "Continue with Google" — Low (open since 10 Oct, item 2.11)
- **Where:** `app/authguard/login/page.tsx:24`, `app/authguard/signup/page.tsx:16`.
- **What goes wrong:** if Google isn't enabled in AuthGuard's project, the button bounces back with "Google sign-in is not available right now."
- **Fix:** reuse the Werkstatt `/auth/v1/settings` check, with a timeout.

---

## Part 2 — Hover pop-ups (`<Explain>`)

### 2.1 The component works where it is used — checked
On `/`, all 7 underlined terms were tested in headless Chromium:
- **Desktop:** hovering opened the pop-up for every term, and moving the pointer from the term onto the pop-up kept it open.
- **Phone (iPhone 13 emulation):** a tap opened it, and a tap elsewhere closed it.
- **Errors:** none in the console and no hydration warnings.

The console pages use the same component (`components/authguard/explain.tsx`). I could not run those pages (they need the database), so I can't rule out a page-specific problem there. If a pop-up fails somewhere specific, note the page and the word; it's not reproducible from the landing page.

### 2.2 The main console page has almost no pop-ups — Medium
- **Where:** `app/authguard/(console)/page.tsx`, `components/authguard/alerts-list.tsx`, `components/authguard/events-table.tsx`.
- **What's there:** `<Explain>` exists only on two column headers ("Client" and "IP hash").
- **What has nothing on hover:**
  - alert titles and summaries
  - severity badges
  - the four stat tiles
  - event-type values (`login_failed`, `session_seen`, `token_invalid`, `password_check`)
  - session ids
- **Why the alert cards can't simply get `<ExplainText>`:** each card is one big `<Link>`. A pop-up trigger is a `<button>`, and a button inside a link is invalid HTML; a click would also open the alert instead of the pop-up.
- **Fix:**
  - Make only the alert title the link (or use a "stretched link" overlay), then wrap the summary in `<ExplainText>`.
  - Add glossary entries for the event types and severities (`lib/authguard/glossary.ts`), and wrap them in the table and badges.

### 2.3 Werkstatt has no pop-ups at all — by design
Werkstatt is the demo **client** app. AuthGuard's explanations live in the AuthGuard pages; nothing is overlaid on Werkstatt. If the intended demo is "AuthGuard pop-ups on top of Werkstatt pages", that feature doesn't exist yet.

### 2.4 Small behaviours — Low
- **Only the first mention is explained:** `<ExplainText>` only wraps the first mention of each term per text block (`explain-text.tsx:19`), so later mentions are plain text.
- **Selecting text can close it:** a pop-up opened by hover (not pinned by a click) closes when the term loses focus, so clicking into the pop-up to select text can close it (`explain.tsx:108`).

---

## Part 3 — Security

### 3.1 No security headers — Medium
- **Where:** `next.config.mjs` has no `headers()`.
- **What goes wrong:** there is no `Content-Security-Policy`, no `frame-ancestors`/`X-Frame-Options` and no `Referrer-Policy`. The login pages can be embedded in another site's frame (clickjacking).
- **Fix:** add at least `frame-ancestors 'none'` (or `X-Frame-Options: DENY`), `Referrer-Policy: strict-origin-when-cross-origin` and `X-Content-Type-Options: nosniff`.

### 3.2 One shared API key, and console reads aren't scoped to an app — Medium (fine for one demo app)
- **Where:** `app/api/v1/events/route.ts`, `lib/repositories/authguard-events-repository.ts:27-37`, `lib/repositories/notifications-repository.ts`.
- **What goes wrong:**
  - Whoever holds `AUTHGUARD_API_KEY` can post events for any `app_id`, with any `occurred_at` (including backdated times).
  - `listRecent()` and the notification queries don't filter by `app_id`, so the console shows every app's data to every owner.
- **Fix:** before adding a second app, use one key per app (stored hashed) that determines the `app_id` on the server, and filter every console query by the owner's app.

### 3.3 Visitor-controlled text reaches the AI prompts — Low
- **Where:** `lib/services/console-data.ts:82` (`userAgent`, `details`) and `lib/services/incident-service.ts:37` (evidence).
- **What goes wrong:** the `User-Agent` header comes from the visitor. Someone can log in to Werkstatt with a crafted user agent that contains instructions for the assistant.
- **Mitigations already in place:** the system prompts say to treat FACTS as data, outputs are short, and they're shown as plain text.
- **Fix:** send `clientFamily(userAgent)` ("Chrome|Windows") to the model instead of the raw string.

### 3.4 Demo mode opens the demo data to every confirmed account — Low (intended, worth knowing)
- **Where:** `lib/services/console-access.ts:44`.
- **What goes wrong:** with `AUTHGUARD_DEMO_MODE=true`, any confirmed AuthGuard account sees Werkstatt's monitoring data. The data is hashed or shortened. If email confirmation is turned off in AuthGuard's project, "confirmed" means anyone who signs up.
- **AI limit:** the limit is 30 requests per hour **per account**, and accounts are free to create.

### 3.5 Login pages display any `?error=` text — Low
- **Where:** `app/*/login/page.tsx` and `app/authguard/auth/callback/route.ts:18,24`, which passes provider and Supabase error text through.
- **What goes wrong:** React escapes the text, so there is no XSS. But a crafted link can show a misleading message on a genuine login page, such as "Your account is locked, call …".
- **Fix:** pass an error **code** and map it to fixed messages.

### 3.6 Origin and client IP come from forwarded headers — Low, depends on hosting
- **Where:** `lib/http.ts:40-48` and `lib/authguard-sdk/index.ts:52`.
- **What goes wrong:**
  - Redirects and `emailRedirectTo` use `x-forwarded-host`.
  - The IP hash uses the first `x-forwarded-for` value.
  - This is fine on hosts that set these headers themselves. Behind a proxy that passes client values through, a client could change the redirect host (Supabase still checks `emailRedirectTo` against its allow-list) or spoof its IP to dodge the network rules.
- **Fix:** use `AUTHGUARD_PUBLIC_URL` / a site URL for redirects, and the platform's trusted client-IP header.

### 3.7 No rate limiting in the app — Low
- **Where:** login and signup, and `POST /api/v1/events`.
- **What happens now:** login and signup rely on Supabase Auth's own limits; the code handles the 429. The Events API has no limit, but compares keys in constant time.

### 3.8 Dependency audit — Info
- **Result:** `pnpm audit --prod` reports one high advisory: `braces` (GHSA-vfj7-8cjw-p6xm, a denial of service on crafted glob patterns).
- **Where it comes from:** the `shadcn` CLI's `fast-glob`. The app doesn't run that code at runtime. `shadcn` has to stay in `dependencies` because `app/globals.css` imports `shadcn/tailwind.css`.

### Checked and found OK
- **No open redirects:** `next` redirects are limited to each product's own path prefix (`lib/safe-redirect.ts`), and `//host` and `/\host` are rejected.
- **Sign-in checks:** sessions are checked with `getUser()`, never trusted from `getSession()`. Claims are decoded only after verification, and the `sub` must match (`auth-context.ts`).
- **Service role key:** server-only (`import 'server-only'`) and used only for the `authguard_*` tables. Werkstatt uses the anon key and RLS only.
- **RLS:** Werkstatt notes have RLS with own-row select, insert and delete policies (`scripts/003`). The `authguard_*` tables have RLS on with no policies, so only the service role can use them.
- **Events API safeguards:**
  - The API key is compared in constant time (`events/route.ts:14-18`).
  - `password`, `token`, `email` and `ip` fields are rejected anywhere in the body.
- **What the SDK sends:**
  - Emails and IPs only as salted SHA-256 hashes, never raw.
  - Passwords never leave the server: the breach check uses k-anonymity (only 5 hex characters are sent) with padding.
  - The SDK's own calls have 2 s timeouts.
- **No account enumeration:** login returns the same message for "no such user" and "wrong password". Signup shows "check your inbox" for existing users too.
- **Alert emails:** every value is HTML-escaped.
- **AI output:** the report validates model output with zod, limits links to an allow-list and drops event ids that aren't in the evidence.

---

## Part 4 — Other issues

| # | Severity | Where | Issue | Fix |
|---|---|---|---|---|
| 4.1 | Medium | `README.md` (was missing) | No setup instructions: two Supabase projects, which SQL goes where, redirect URLs, email templates, env vars | Added in this commit |
| 4.2 | Low | `lib/detection/types.ts:72` | Alert ids use the time bucket of the *first* evidence event. When old events leave the 7-day / 2000-event window, an alert can get a new id, re-notify, and leave the old link pointing to a 404 (open since 10 Oct, 2.10) | Derive the bucket from the triggering event |
| 4.3 | Low | `scripts/001_init.sql` | Legacy schema (`session_events`, `user_id_by_email`, `is_rls_enabled`). No code uses it | Delete it, or mark it legacy (the README says not to run it) |
| 4.4 | Low | `tsconfig.tsbuildinfo`, `next-env.d.ts` | Build artefacts are committed; `tsbuildinfo` changes on every typecheck (open since 10 Oct, 2.23) | `git rm --cached` both and add them to `.gitignore` |
| 4.5 | Low | `lib/services/auth-context.ts` | Werkstatt-only helper sits among the AuthGuard services (open since 10 Oct, 2.24) | Move it to `lib/werkstatt/` |
| 4.6 | Low | `components/ui/*` vs `lib/utils.ts` | Two `cn()` implementations: the `cn` npm package in shadcn components, `clsx` + `tailwind-merge` elsewhere | Use one |
| 4.7 | Low | `package.json` | `"name": "my-project"` | Rename it to `authguard` |
| 4.8 | Low | `app/authguard/error.tsx:14` | "a missing configuration value" is shown to visitors | Neutral wording, like the Werkstatt error page |

---

## Part 5 — Status of the 2026-10-10 audit

| Item | Status now |
|---|---|
| 2.1 tampered-token rule unreachable | **Fixed** (the proxy reports it), but see 1.2: it now also fires on outages |
| 2.2 burst escalation email | **Fixed** (`escalateToHigh`) |
| 2.3 session reuse false highs | **Fixed** (browser/OS family = high, IP only = low) |
| 2.4 unread notifications forever | **Fixed** (marked read before `notFound()`, plus "Mark all as read") |
| 2.5 one env var takes the site down | **Fixed** (only the core groups fail in production) |
| 2.6 "No apps" dead end | **Fixed** (link to the demo app) |
| 2.7 daily weak-password alerts | **Fixed** (one alert per account) |
| 2.8 mixed 404 / error pages | **Fixed** |
| 2.9 AuthGuard inherits Werkstatt metadata | **Fixed** |
| 2.10 alert ids shift | Open (4.2) |
| 2.11 Google button always shown | Open (1.6) |
| 2.12 setup not documented | **Fixed** by the README in this commit (no status endpoint yet) |
| 2.13 email links use the request host | **Fixed** (`AUTHGUARD_PUBLIC_URL`) |
| 2.14 "lab" wording | **Fixed** |
| 2.15 over-promising wording | **Fixed** |
| 2.16 booking promise | **Fixed** ("Booking opens soon") |
| 2.17 session page window and double decode | **Fixed** |
| 2.18 assistant suggestion | **Fixed** |
| 2.19 "Free to start" | **Fixed** |
| 2.20 `test` event type | **Fixed** (removed) |
| 2.21 technical root error text | **Fixed** for the root and Werkstatt pages; the AuthGuard page still has it (4.8) |
| 2.22 references to missing routes | **Fixed** |
| 2.23 committed build artefacts | Open (4.4) |
| 2.24 generic helper name | Open (4.5) |
| 2.25 cookie rename logs users out | Accepted for a demo |
