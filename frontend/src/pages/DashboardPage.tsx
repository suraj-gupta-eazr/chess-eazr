import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import type { Club, Profile } from '../types/domain'

export function DashboardPage({ profile }: { profile: Profile }) {
  const [clubs, setClubs] = useState<Club[]>([])
  useEffect(() => { void api<Club[]>('/clubs').then(setClubs) }, [])
  const joined = clubs.filter((club) => club.joined).slice(0, 3)
  return <>
    <section className="dashboard-hero"><div><p className="eyebrow dark">GOOD TO SEE YOU, {profile.name.split(' ')[0].toUpperCase()}</p><h1>What will you<br /><em>play for?</em></h1></div><div className="hero-piece" aria-hidden="true">♞</div><Link className="play-ticket" to="/play"><span>QUICK MATCH</span><b>Find a random opponent</b><i>10 min</i><strong>PLAY NOW →</strong></Link></section>
    <section className="section-heading"><div><p className="eyebrow dark">YOUR CIRCLE</p><h2>Club rooms</h2></div><Link to="/clubs">View all clubs →</Link></section>
    <div className="club-strip">{joined.map((club, index) => <Link to={`/clubs/${club.id}`} className="club-row" key={club.id}><span className={`club-sigil sigil-${index % 3}`}>{club.name.slice(0, 2).toUpperCase()}</span><div><b>{club.name}</b><small>{club.member_count} members · {club.visibility}</small></div><i>→</i></Link>)}{joined.length === 0 && <Link to="/clubs" className="empty-line"><b>Your first club starts here.</b><span>Join a public room or create your own →</span></Link>}</div>
  </>
}
