import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import type { Profile } from '../types/domain'
import { Mark } from './ui'

export function Shell({ profile, onLogout, children }: { profile: Profile; onLogout: () => void; children: ReactNode }) {
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/" className="brand"><Mark /> CHECKMATE CLUB</Link>
      <nav aria-label="Main navigation"><NavLink to="/" end>Home</NavLink><NavLink to="/clubs">Clubs</NavLink><NavLink to="/profile">Profile</NavLink></nav>
      <div className="member-chip"><span>{profile.username.slice(0, 1).toUpperCase()}</span><b>{profile.username}</b><button onClick={onLogout} title="Sign out" aria-label="Sign out">↗</button></div>
    </header>
    <main className="page">{children}</main>
  </div>
}
