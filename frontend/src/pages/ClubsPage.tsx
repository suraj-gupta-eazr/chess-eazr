import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field } from '../components/ui'
import { api } from '../services/api'
import type { Club } from '../types/domain'

export function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [error, setError] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const navigate = useNavigate()
  const load = () => api<Club[]>('/clubs').then(setClubs).catch((cause) => setError(cause.message))
  useEffect(() => { void load() }, [])
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    try { const club = await api<Club>('/clubs', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); navigate(`/clubs/${club.id}`) }
    catch (cause) { setError((cause as Error).message) }
  }
  async function joinPublic(id: string) { await api(`/clubs/${id}/join`, { method: 'POST', body: '{}' }); void load() }
  async function joinPrivate(event: FormEvent) {
    event.preventDefault(); setError('')
    try { const club = await api<Club>('/clubs/join-private', { method: 'POST', body: JSON.stringify({ inviteCode }) }); navigate(`/clubs/${club.id}`) }
    catch (cause) { setError((cause as Error).message) }
  }
  return <><section className="page-title"><div><p className="eyebrow dark">CLUB DIRECTORY</p><h1>Find your table.</h1></div><p>Join an open club instantly.<br />Use an invite code for private clubs.</p></section>{error && <p className="form-error" role="alert">{error}</p>}
    <div className="clubs-layout"><section><h2 className="ruled-title">Open clubs <span>{clubs.length}</span></h2><div className="directory-list">{clubs.map((club, index) => <article key={club.id}><span className={`club-sigil sigil-${index % 3}`}>{club.name.slice(0, 2).toUpperCase()}</span><div><h3>{club.name}</h3><p>{club.member_count} members · {club.visibility}</p></div>{club.joined ? <Link to={`/clubs/${club.id}`}>Enter →</Link> : <button onClick={() => joinPublic(club.id)}>Join club</button>}</article>)}</div></section>
      <aside className="club-actions"><form onSubmit={joinPrivate}><p className="eyebrow">PRIVATE ENTRY</p><h2>Have a code?</h2><input aria-label="Private club invite code" value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="8-character code" maxLength={8} required /><button className="button button-light">Enter private club</button></form><form onSubmit={create}><p className="eyebrow">START A ROOM</p><h2>Create a club</h2><Field label="Club name"><input name="name" required minLength={3} /></Field><Field label="Access"><select name="visibility"><option value="public">Public — anyone can join</option><option value="private">Private — invite code only</option></select></Field><button className="button button-primary">Create club</button></form></aside>
    </div></>
}
