import 'server-only'
import { GLOSSARY, RULE_TERMS } from '@/lib/authguard/glossary'
import type { Alert } from '@/lib/detection/types'

const FROM = 'AuthGuard <onboarding@resend.dev>'

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)

// Plain language without an AI call: the rule's summary plus the static
// glossary entry for that rule. Alerts only ever carry hash prefixes and
// shortened refs, never raw IPs, emails or tokens.
export function buildAlertEmail(alert: Alert, alertUrl: string) {
  const term = RULE_TERMS[alert.ruleId]
  const explanation = term ? GLOSSARY[term].body.replaceAll('*', '') : alert.ruleDescription
  const when = new Date(alert.occurredAt).toUTCString()
  const affected = [
    alert.subject,
    alert.sessionId && `session ${alert.sessionId.slice(0, 8)}`,
    alert.userRef && `user ref ${alert.userRef.slice(0, 8)}`,
  ]
    .filter((item, index, all): item is string => Boolean(item) && all.indexOf(item) === index)
    .join(' · ')

  const subject = `[AuthGuard] ${alert.severity}: ${alert.title}`
  const text = [alert.summary, '', explanation, '', `Time: ${when}`, `Affected: ${affected}`, '', `Open the alert: ${alertUrl}`].join('\n')
  const color = alert.severity === 'high' ? '#DC2626' : '#D97706'
  const html = `<!doctype html>
<html><body style="margin:0;background:#F8FAFC;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0F172A">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:28px">
      <tr><td style="font-weight:600;font-size:15px">&#128737; AuthGuard</td></tr>
      <tr><td style="padding-top:20px"><span style="display:inline-block;border:1px solid ${color};color:${color};border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600;text-transform:uppercase">${escapeHtml(alert.severity)}</span></td></tr>
      <tr><td style="padding-top:12px;font-size:20px;font-weight:600">${escapeHtml(alert.title)}</td></tr>
      <tr><td style="padding-top:12px;font-size:15px;line-height:1.6">${escapeHtml(alert.summary)}</td></tr>
      <tr><td style="padding-top:12px;font-size:14px;line-height:1.6;color:#64748B">${escapeHtml(explanation)}</td></tr>
      <tr><td style="padding-top:16px;font-size:13px;color:#64748B;line-height:1.7">
        <strong style="color:#0F172A">Time:</strong> ${escapeHtml(when)}<br>
        <strong style="color:#0F172A">Affected:</strong> ${escapeHtml(affected)}
      </td></tr>
      <tr><td style="padding-top:24px"><a href="${escapeHtml(alertUrl)}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:6px">Open alert in console</a></td></tr>
    </table>
  </td></tr></table>
</body></html>`
  return { subject, text, html }
}

/** Sends through the Resend REST API. Returns false (never throws) when sending failed. */
export async function sendAlertEmail(input: { apiKey: string; to: string; alert: Alert; alertUrl: string }): Promise<boolean> {
  const { subject, text, html } = buildAlertEmail(input.alert, input.alertUrl)
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${input.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [input.to], subject, text, html }),
    })
    if (!response.ok) console.error(`[notifications] Resend responded ${response.status}`)
    return response.ok
  } catch (error) {
    console.error(`[notifications] Resend request failed: ${(error as Error).message}`)
    return false
  }
}
