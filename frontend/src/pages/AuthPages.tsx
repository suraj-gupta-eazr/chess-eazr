import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, auth, type Session } from '../services/api'
import { Field, PublicLayout } from '../components/ui'

export function LoginPage({ onSession }: { onSession: (session: Session) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const data = await api<{ session: Session }>('/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) })
      auth.set(data.session); onSession(data.session)
    } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }
  return <PublicLayout><div className="auth-form-wrap"><p className="folio">MEMBER ACCESS / 01</p><h2>Welcome back.</h2><p className="muted">Your next game is waiting.</p>
    <form onSubmit={submit} className="form-stack"><Field label="Email address"><input name="email" type="email" autoComplete="email" required /></Field><Field label="Password"><input name="password" type="password" autoComplete="current-password" required /></Field>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? 'Signing in…' : 'Enter the club'}</button></form>
    <p className="switch-copy">New to the board? <Link to="/register">Create an account</Link></p>
  </div></PublicLayout>
}

export function RegisterPage({ onSession }: { onSession: (session: Session) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const data = await api<{ session: Session }>('/auth/register', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) })
      auth.set(data.session); onSession(data.session)
    } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }
  return <PublicLayout><div className="auth-form-wrap register-wrap"><p className="folio">NEW MEMBER / 02</p><h2>Take your seat.</h2><p className="muted">We’ll create a short username. You can change it later.</p>
    <form onSubmit={submit} className="form-stack compact-form"><div className="form-pair"><Field label="Full name"><input name="name" autoComplete="name" minLength={2} required /></Field><Field label="Age"><input name="age" type="number" min="13" max="120" required /></Field></div><Field label="Gender"><select name="gender" defaultValue="prefer_not_to_say"><option value="prefer_not_to_say">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option></select></Field><Field label="Email address"><input name="email" type="email" autoComplete="email" required /></Field><Field label="Password" hint="At least 8 characters"><input name="password" type="password" minLength={8} autoComplete="new-password" required /></Field>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? 'Creating account…' : 'Join Checkmate Club'}</button></form>
    <p className="switch-copy">Already a member? <Link to="/login">Sign in</Link></p>
  </div></PublicLayout>
}
