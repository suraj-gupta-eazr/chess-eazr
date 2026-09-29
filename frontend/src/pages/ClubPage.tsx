import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Field, Loading } from '../components/ui'
import { api } from '../services/api'
import type { ClubDetail, Profile, Tournament } from '../types/domain'

export function ClubPage({ profile }: { profile: Profile }) {
  const { id } = useParams()
  const [club, setClub] = useState<ClubDetail | null>(null)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState('')
  const [format, setFormat] = useState<'short' | 'ipl'>('short')
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const navigate = useNavigate()
  useEffect(() => { void api<ClubDetail>(`/clubs/${id}`).then(setClub).catch((cause) => setError(cause.message)) }, [id])
  const selectionValid = useMemo(() => format === 'short' ? [4, 8, 16].includes(selectedPlayers.length) : selectedPlayers.length >= 4 && selectedPlayers.length <= 16, [format, selectedPlayers.length])
  if (!club) return <Loading message={error || 'Opening the club…'} />
  const currentClub = club
  const owner = currentClub.owner_id === profile.id

  function togglePlayer(playerId: string) {
    setSelectedPlayers((current) => current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId])
  }
  async function createTournament(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    if (!selectionValid) return
    const form = new FormData(event.currentTarget)
    try {
      const tournament = await api<Tournament>(`/clubs/${currentClub.id}/tournaments`, { method: 'POST', body: JSON.stringify({ name: form.get('name'), format, playerIds: selectedPlayers }) })
      await api(`/tournaments/${tournament.id}/start`, { method: 'POST' }); navigate(`/tournaments/${tournament.id}`)
    } catch (cause) { setError((cause as Error).message) }
  }
  async function newInvite() { const data = await api<{ inviteCode: string }>(`/clubs/${currentClub.id}/invite-code`, { method: 'POST' }); setInvite(data.inviteCode) }
  return <><section className="club-masthead"><p className="eyebrow">{currentClub.visibility.toUpperCase()} CLUB</p><h1>{currentClub.name}</h1><p>{currentClub.members.length} members at the table</p></section>{error && <p className="form-error" role="alert">{error}</p>}
    <div className="club-detail-grid"><section><h2 className="ruled-title">Members <span>{currentClub.members.length}</span></h2><ol className="member-list">{currentClub.members.map((member) => <li key={member.id}><span>{member.username.slice(0, 1).toUpperCase()}</span><div><b>{member.username}</b><small>{member.name}</small></div><i>{member.role}</i></li>)}</ol></section>
      <section><h2 className="ruled-title">Tournaments <span>{currentClub.tournaments.length}</span></h2><div className="tournament-list">{currentClub.tournaments.map((item) => <Link key={item.id} to={`/tournaments/${item.id}`}><span>{item.format === 'ipl' ? 'IPL' : 'KO'}</span><div><b>{item.name}</b><small>{item.status} · {item.format === 'ipl' ? 'full league' : 'short knockout'}</small></div><i>→</i></Link>)}{currentClub.tournaments.length === 0 && <p className="muted empty-copy">No tournaments yet. The club owner can start one below.</p>}</div></section></div>
    {owner && <section className="owner-workbench"><div className="owner-intro"><p className="eyebrow">OWNER’S DESK</p><h2>Start a tournament</h2><p>Choose how members compete, then select the players. Pairings are created automatically.</p>{currentClub.visibility === 'private' && <button className="text-button" onClick={newInvite}>Generate a new invite code</button>}{invite && <div className="invite-result"><small>Share this code once</small><strong className="invite-code">{invite}</strong></div>}</div>
      <form onSubmit={createTournament} className="tournament-builder"><Field label="Tournament name"><input name="name" placeholder="Sunday Open" required minLength={3} /></Field>
        <fieldset className="format-fieldset"><legend>Choose tournament format</legend><div className="format-options">
          <label className={format === 'short' ? 'selected' : ''}><input type="radio" name="format" value="short" checked={format === 'short'} onChange={() => setFormat('short')} /><span><b>Short knockout</b><small>Fast elimination. With 8 players: 4 matches, 2 semifinals, then the final.</small><em>4, 8, or 16 players</em></span></label>
          <label className={format === 'ipl' ? 'selected' : ''}><input type="radio" name="format" value="ipl" checked={format === 'ipl'} onChange={() => setFormat('ipl')} /><span><b>Full IPL</b><small>Everyone plays everyone once. The top four enter IPL-style playoffs.</small><em>4–16 players</em></span></label>
        </div></fieldset>
        <fieldset className="players-fieldset"><legend>Select players <span>{selectedPlayers.length} selected</span></legend><div className="player-checks">{currentClub.members.map((member) => <label className={selectedPlayers.includes(member.id) ? 'checked' : ''} key={member.id}><input type="checkbox" checked={selectedPlayers.includes(member.id)} onChange={() => togglePlayer(member.id)} /><span>{member.username}</span></label>)}</div><p className={selectionValid ? 'selection-help valid' : 'selection-help'}>{selectionValid ? 'Ready to create the tournament.' : format === 'short' ? 'Select exactly 4, 8, or 16 players.' : 'Select between 4 and 16 players.'}</p></fieldset>
        <button className="button button-light" disabled={!selectionValid}>Create tournament & start</button>
      </form>
    </section>}
  </>
}
