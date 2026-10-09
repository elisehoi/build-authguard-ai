export type PostResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string; message: string }

type ApiErrorBody = { error?: { code?: string; message?: string } }

// One place that turns our typed { error: { code, message } } responses into
// a result object, so UI components never parse fetch responses themselves.
export async function postJson<T>(url: string, body?: unknown): Promise<PostResult<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const json: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const error = (json as ApiErrorBody | null)?.error
      if (response.status === 401) {
        return { ok: false, status: 401, code: 'unauthenticated', message: 'Your session expired. Please log in again.' }
      }
      return {
        ok: false,
        status: response.status,
        code: error?.code ?? 'request_failed',
        message: error?.message ?? 'Something went wrong. Please try again.',
      }
    }
    return { ok: true, data: json as T }
  } catch {
    return { ok: false, status: 0, code: 'network', message: 'Network error. Check your connection and try again.' }
  }
}
