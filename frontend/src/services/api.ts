export type Session = { access_token: string; refresh_token: string; expires_at?: number; user: { id: string; email?: string } }

const base = import.meta.env.VITE_API_URL || '/api'
const key = 'checkmate-session'

export const auth = {
  get: (): Session | null => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
  },
  set: (session: Session | null) => session ? localStorage.setItem(key, JSON.stringify(session)) : localStorage.removeItem(key),
}

async function request<T>(path: string, init: RequestInit, session: Session | null, canRefresh: boolean): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...init.headers,
    },
  })
  if (response.status === 401 && session?.refresh_token && canRefresh && path !== '/auth/refresh') {
    const refreshed = await request<{ session: Session }>('/auth/refresh', {
      method: 'POST', body: JSON.stringify({ refreshToken: session.refresh_token }),
    }, null, false)
    auth.set(refreshed.session)
    return request<T>(path, init, refreshed.session, false)
  }
  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}

export function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(path, init, auth.get(), true)
}
