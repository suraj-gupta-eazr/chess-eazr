import app from './app.js'
import { env } from './config/env.js'

if (!process.env.VERCEL) app.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`))

export default app
