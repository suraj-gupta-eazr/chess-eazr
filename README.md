# Checkmate Club

A React + Express chess club platform with random matchmaking, private and public clubs, short knockout tournaments, and full IPL-style tournaments.

## Architecture

- `backend/src/config/database.ts` creates the real PostgreSQL connection from `DATABASE_URL`.
- `backend/src/config/supabase.ts` configures authentication and realtime clients.
- `backend/src/modules/*` contains one folder per entity/domain with routes, controllers, services, and validation schemas.
- `frontend/src/pages` contains route-level screens; `frontend/src/components` contains reusable UI; `frontend/src/services` contains API and realtime clients.
- `supabase/migrations` is the source of truth for PostgreSQL tables, constraints, indexes, triggers, and row-level security.

See [`PLAN.md`](PLAN.md) for the implementation plan and project boundaries.

## Local setup

1. Create a Supabase project and run `supabase/migrations/001_initial.sql` in its SQL editor.
2. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`.
3. Disable **Confirm email** in Supabase Authentication → Providers → Email.
4. Run `npm install`, then `npm run dev`.

The backend reads its local PostgreSQL and Supabase credentials from `backend/.env` using Node's native environment-file support. The production deployment reads the same variable names from Vercel.

The frontend runs at `http://localhost:5173` and proxies `/api` to Express at `http://localhost:3000`.

## Vercel deployment

Create two Vercel projects from this repository:

- Frontend root directory: `frontend`
- Backend root directory: `backend`

Add the variables from each `.env.example` in the matching Vercel project. Set `WEB_ORIGIN` to the deployed frontend URL and `VITE_API_URL` to the deployed backend URL.
