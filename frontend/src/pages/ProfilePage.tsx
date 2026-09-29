import { useState, type FormEvent } from 'react'
import { Field } from '../components/ui'
import { api } from '../services/api'
import type { Profile } from '../types/domain'

export function ProfilePage({ profile, reload }: { profile: Profile; reload: () => void }) {
  const [username, setUsername] = useState(profile.username)
  const [message, setMessage] = useState('')
  async function save(event: FormEvent) {
    event.preventDefault(); setMessage('')
    try { await api('/me', { method: 'PATCH', body: JSON.stringify({ username }) }); setMessage('Username updated.'); reload() }
    catch (cause) { setMessage((cause as Error).message) }
  }
  return <section className="narrow-page"><p className="eyebrow dark">MEMBER PROFILE</p><h1>Your name<br />on the board.</h1><div className="profile-sheet"><div className="profile-monogram">{profile.name.slice(0, 1)}</div><div><h2>{profile.name}</h2><p>{profile.email}</p></div></div>
    <form onSubmit={save} className="edit-username"><Field label="Username" hint="3–20 lowercase letters, numbers, or underscores"><input value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} pattern="[a-z][a-z0-9_]{2,19}" maxLength={20} required /></Field><button className="button button-primary">Save username</button></form>
    {message && <p className="form-message" role="status">{message}</p>}<dl className="private-data"><div><dt>Age</dt><dd>{profile.age}</dd></div><div><dt>Gender</dt><dd>{profile.gender.replaceAll('_', ' ')}</dd></div><p>Only you can see this account information.</p></dl>
  </section>
}
