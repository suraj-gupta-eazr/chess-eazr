import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Mark() {
  return <span className="brand-mark" aria-hidden="true"><i /><b>♞</b></span>
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return <main className="auth-shell">
    <section className="auth-story">
      <Link to="/" className="brand brand-on-dark"><Mark /> CHECKMATE CLUB</Link>
      <div className="story-copy"><p className="eyebrow">THE CLUB IS OPEN</p><h1>Every move<br />finds its match.</h1><p>Play a stranger. Build your club. Take the final square.</p></div>
      <p className="story-note">5–30 minute games · live tournaments · no noise</p>
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
