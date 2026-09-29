import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import type { Game } from '../types/domain'

export function MatchmakingPage() {
  const [status, setStatus] = useState('Looking for an available player…')
  const navigate = useNavigate()
  useEffect(() => {
    let stopped = false
    async function seek() {
      try {
        const result = await api<{ status: string; game?: Game }>('/matchmaking/join', { method: 'POST' })
        if (result.game) navigate(`/games/${result.game.id}`)
        else if (!stopped) setTimeout(seek, 1800)
      } catch (cause) { setStatus((cause as Error).message) }
    }
    void seek()
    return () => { stopped = true; void api('/matchmaking/leave', { method: 'DELETE' }).catch(() => undefined) }
  }, [navigate])
  return <section className="matchmaking"><div className="search-knight">♞<i /><i /><i /></div><p className="eyebrow dark">RANDOM PAIRING</p><h1>Finding your match.</h1><p>{status}</p><div className="time-seal"><span>10</span><small>MINUTES<br />EACH</small></div><Link to="/" className="text-button">Cancel search</Link></section>
}
