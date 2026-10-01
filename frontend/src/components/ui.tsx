import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Mark() {
  return <span className="brand-mark" aria-hidden="true"><i /><b>C</b></span>
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return <main className="auth-shell">
    <section className="auth-story">
      <Link to="/" className="brand brand-on-dark"><Mark /> CHECKMATE CLUB</Link>
      <div className="story-copy"><p className="eyebrow">COMPETITIVE CHESS, LIVE</p><h1>Enter sharp.<br />Leave ranked.</h1><p>Instant matches, private clubs, and tournament brackets built for serious play.</p></div>
      <p className="story-note">RAPID · BLITZ · CLUB LEAGUES · LIVE BRACKETS</p>
    </section>
    <section className="auth-panel">{children}</section>
  </main>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}

export function Loading({ message }: { message: string }) {
  return <div className="loading"><span>♞</span><p>{message}</p></div>
}
