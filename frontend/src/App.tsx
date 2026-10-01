import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Loading } from './components/ui'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages'
import { api, auth, type Session } from './services/api'
import type { Profile } from './types/domain'

const ClubPage = lazy(() => import('./pages/ClubPage').then((module) => ({ default: module.ClubPage })))
const ClubsPage = lazy(() => import('./pages/ClubsPage').then((module) => ({ default: module.ClubsPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const GamePage = lazy(() => import('./pages/GamePage').then((module) => ({ default: module.GamePage })))
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((module) => ({ default: module.HistoryPage })))
const MatchmakingPage = lazy(() => import('./pages/MatchmakingPage').then((module) => ({ default: module.MatchmakingPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const TournamentPage = lazy(() => import('./pages/TournamentPage').then((module) => ({ default: module.TournamentPage })))

export default function App() {
  const [session, setSession] = useState<Session | null>(() => auth.get())
  const [profile, setProfile] = useState<Profile | null>(null)
  const loadProfile = () => {
    if (session) void api<Profile>('/me').then(setProfile).catch(() => { auth.set(null); setSession(null) })
  }
  useEffect(loadProfile, [session?.access_token])

  function logout() { auth.set(null); setSession(null); setProfile(null) }

  if (!session) return <Routes><Route path="/register" element={<RegisterPage onSession={setSession} />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /><Route path="*" element={<LoginPage onSession={setSession} />} /></Routes>
  if (!profile) return <Loading message="Opening the club…" />

  return <Shell profile={profile} onLogout={logout}><Suspense fallback={<Loading message="Preparing the page…" />}><Routes>
    <Route path="/" element={<DashboardPage profile={profile} />} />
    <Route path="/profile" element={<ProfilePage profile={profile} reload={loadProfile} />} />
    <Route path="/clubs" element={<ClubsPage />} />
    <Route path="/clubs/:id" element={<ClubPage profile={profile} />} />
    <Route path="/tournaments/:id" element={<TournamentPage profile={profile} />} />
    <Route path="/play" element={<MatchmakingPage />} />
    <Route path="/history" element={<HistoryPage />} />
    <Route path="/games/:id" element={<GamePage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></Shell>
}
