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
  return <PublicLayout><div className="auth-form-wrap register-wrap"><p className="folio">NEW MEMBER / 02</p><h2>Take your seat.</h2><p className="muted">Your username starts with your first name. You can change it later.</p>
    <form onSubmit={submit} className="form-stack compact-form"><div className="form-pair"><Field label="First name"><input name="name" autoComplete="given-name" minLength={2} maxLength={30} pattern="\S+" title="Enter your first name only" required /></Field><Field label="Age"><input name="age" type="number" min="13" max="120" required /></Field></div><fieldset className="gender-field"><legend>Gender</legend><div className="gender-options"><label><input type="radio" name="gender" value="female" /><span>Female</span></label><label><input type="radio" name="gender" value="male" /><span>Male</span></label><label><input type="radio" name="gender" value="non_binary" /><span>Non-binary</span></label><label><input type="radio" name="gender" value="prefer_not_to_say" defaultChecked /><span>Prefer not to say</span></label></div></fieldset><Field label="Email address"><input name="email" type="email" autoComplete="email" required /></Field><Field label="Password" hint="At least 8 characters"><input name="password" type="password" minLength={8} autoComplete="new-password" required /></Field>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button></form>
    <p className="switch-copy">Already a member? <Link to="/login">Sign in</Link></p>
  </div></PublicLayout>
}
