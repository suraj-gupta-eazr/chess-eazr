import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, auth, type Session } from '../services/api'
import { Field, PublicLayout } from '../components/ui'
import { supabase } from '../services/realtime'

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
    <form onSubmit={submit} className="form-stack"><Field label="Email address"><input name="email" type="email" autoComplete="email" required /></Field><Field label="Password"><input name="password" type="password" autoComplete="current-password" required /></Field><Link className="forgot-link" to="/forgot-password">Forgot password?</Link>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button></form>
    <p className="switch-copy">New to the board? <Link to="/register">Create an account</Link></p>
  </div></PublicLayout>
}

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const data = await api<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) })
      setMessage(data.message)
    } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }
  return <PublicLayout><div className="auth-form-wrap"><p className="folio">ACCOUNT RECOVERY / 03</p><h2>Reset your clock.</h2><p className="muted">Enter the email and age used for your account. We’ll email you a secure reset link.</p>
    <form onSubmit={submit} className="form-stack"><Field label="Email address"><input name="email" type="email" autoComplete="email" required /></Field><Field label="Age"><input name="age" type="number" min="13" max="120" required /></Field>{message && <p className="form-message" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button></form>
    <p className="switch-copy"><Link to="/login">← Back to login</Link></p>
  </div></PublicLayout>
}

export function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!supabase) { setError('Password recovery is unavailable.'); return }
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError || !data.session) setError('This reset link is invalid or has expired.')
      else setReady(true)
    })
  }, [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    if (password !== form.get('confirmPassword')) { setError('Passwords do not match.'); setBusy(false); return }
    const { error: updateError } = await supabase!.auth.updateUser({ password })
    if (updateError) setError(updateError.message)
    else { await supabase!.auth.signOut(); setComplete(true) }
    setBusy(false)
  }
  return <PublicLayout><div className="auth-form-wrap"><p className="folio">NEW PASSWORD / 04</p><h2>Choose a new key.</h2><p className="muted">Use at least eight characters that you do not use elsewhere.</p>
    {complete ? <><p className="form-message" role="status">Password updated. You can log in now.</p><Link className="button button-primary button-link" to="/login">Go to login</Link></> : <form onSubmit={submit} className="form-stack"><Field label="New password"><input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required /></Field><Field label="Confirm new password"><input name="confirmPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" required /></Field>{!ready && !error && <p className="form-message">Checking reset link…</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy || !ready}>{busy ? 'Updating…' : 'Update password'}</button></form>}
    {!complete && <p className="switch-copy"><Link to="/forgot-password">Request another link</Link></p>}
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
