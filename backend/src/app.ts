import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error.js'
import { requireAuth } from './middleware/auth.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { clubRoutes } from './modules/clubs/club.routes.js'
import { gameRoutes } from './modules/games/game.routes.js'
import { matchmakingRoutes } from './modules/matchmaking/matchmaking.routes.js'
import { profileRoutes } from './modules/profiles/profile.routes.js'
import { tournamentRoutes } from './modules/tournaments/tournament.routes.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: env.webOrigins }))
app.use(express.json({ limit: '32kb' }))

app.get('/health', (_request, response) => response.json({ ok: true }))
app.use('/auth', authRoutes)
app.use('/me', requireAuth, profileRoutes)
app.use('/clubs', requireAuth, clubRoutes)
app.use('/', requireAuth, tournamentRoutes)
app.use('/matchmaking', requireAuth, matchmakingRoutes)
app.use('/games', requireAuth, gameRoutes)
app.use(errorHandler)

export default app
