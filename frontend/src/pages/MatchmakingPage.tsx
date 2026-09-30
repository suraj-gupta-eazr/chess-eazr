import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import type { Game } from '../types/domain'

type Mode = 'random' | 'bot'
type Minutes = 3 | 5 | 10

export function MatchmakingPage() {
  const [mode, setMode] = useState<Mode>('random')
  const [minutes, setMinutes] = useState<Minutes>(10)
  const [searching, setSearching] = useState(false)
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!searching) return
    let stopped = false
    async function seek() {
      if (stopped) return
      try {
        const result = await api<{ status: string; game?: Game }>('/matchmaking/join', {
          method: 'POST', body: JSON.stringify({ mode, minutes }),
        })
        if (result.game) navigate(`/games/${result.game.id}`)
        else if (!stopped) setTimeout(seek, 1800)
      } catch (cause) { setStatus((cause as Error).message); setSearching(false) }
    }
    void seek()
    return () => { stopped = true; if (mode === 'random') void api('/matchmaking/leave', { method: 'DELETE' }).catch(() => undefined) }
  }, [searching, mode, minutes, navigate])

  if (searching) return <section className="matchmaking"><div className="search-knight">♞<i /><i /><i /></div><p className="eyebrow dark">{mode === 'bot' ? 'SETTING THE BOT' : 'RANDOM PAIRING'}</p><h1>{mode === 'bot' ? 'Preparing the board.' : 'Finding your match.'}</h1><p>{status || (mode === 'bot' ? 'Club Bot is taking the black pieces…' : `Searching for another ${minutes}-minute player…`)}</p><div className="time-seal"><span>{minutes}</span><small>MINUTES<br />EACH</small></div><button onClick={() => setSearching(false)} className="text-button">Cancel search</button></section>

  return <section className="play-setup"><header><p className="eyebrow dark">NEW GAME</p><h1>Choose your table.</h1><p>Pick an opponent and clock before the first move.</p></header>
    <div className="opponent-options" role="radiogroup" aria-label="Opponent"><label className={mode === 'random' ? 'selected' : ''}><input type="radio" name="mode" checked={mode === 'random'} onChange={() => setMode('random')} /><span className="mode-piece">♞</span><b>Random player</b><small>Match with another online club member using the same clock.</small><em>LIVE OPPONENT</em></label><label className={mode === 'bot' ? 'selected' : ''}><input type="radio" name="mode" checked={mode === 'bot'} onChange={() => setMode('bot')} /><span className="mode-piece">♟</span><b>Club Bot</b><small>Start immediately against a quick, capture-aware computer player.</small><em>INSTANT GAME</em></label></div>
    <fieldset className="clock-choice"><legend>Choose time per player</legend><div>{([3, 5, 10] as Minutes[]).map((value) => <label className={minutes === value ? 'selected' : ''} key={value}><input type="radio" name="minutes" checked={minutes === value} onChange={() => setMinutes(value)} /><strong>{value}</strong><span>min</span><small>{value === 3 ? 'Blitz' : value === 5 ? 'Quick' : 'Rapid'}</small></label>)}</div></fieldset>
    {status && <p className="form-error" role="alert">{status}</p>}<div className="play-actions"><button className="button button-primary" onClick={() => { setStatus(''); setSearching(true) }}>{mode === 'bot' ? 'Play Club Bot' : 'Find random player'}</button><Link to="/" className="text-button">Back home</Link></div>
  </section>
}
