# Checkmate Club — Implementation Plan

**Status:** Implemented, migrated, and verified.

## Goal

Build a production-ready chess website with a React frontend, an Express backend, and a real PostgreSQL database. Users can register, edit a short username, play random 10-minute games, manage public/private clubs, and run short knockout or full IPL tournaments.

## Project Structure

```text
frontend/
  src/
    components/       Shared layout, form, feedback, and chess components
    pages/            One component per route and user task
    services/         HTTP, authentication, and realtime clients
    types/            Frontend domain contracts
    App.tsx            Route composition only

backend/
  src/
    config/           Environment, PostgreSQL, and Supabase connections
    middleware/       Authentication, validation, and error handling
    modules/
      auth/            Controller, service, schema, routes
      profiles/        Controller, service, schema, routes
      clubs/           Controller, service, schema, routes
      tournaments/     Controller, service, engine, schema, routes
      matchmaking/     Controller, service, routes
      games/           Controller, service, schema, routes
    shared/           Shared HTTP helpers and types
    app.ts             Express configuration and route mounting
    index.ts           Local/Vercel entrypoint

supabase/migrations/   Versioned PostgreSQL schema, constraints, indexes, and RLS
```

## Backend Implementation

- Keep PostgreSQL as the only application database. Connect through `DATABASE_URL` in `backend/src/config/database.ts` using the Supabase transaction pooler in production.
- Keep Supabase only for PostgreSQL hosting, password authentication, and realtime delivery; no mock or demo data paths.
- Give every domain its own routes → controller → service flow. Controllers translate HTTP requests; services own database transactions and business rules.
- Keep Zod validation at every request boundary, shared authentication middleware, and one centralized error handler.
- Move username generation and tournament pairing/progression into focused domain utilities with Node tests.
- Preserve current REST endpoints so the frontend does not depend on internal backend organization.

## Frontend Implementation

- Split the monolithic UI into route pages and reusable layout/form/chess components.
- Keep the editorial chess-club direction: warm paper, ink, muted green, and oxblood accents with strong typographic hierarchy.
- Make navigation and status language direct: users should always understand the next action, whose turn it is, and tournament progress.
- Replace the tournament form with clear format choices explaining “Short knockout” versus “Full IPL,” live participant counts, valid-size guidance, and a disabled start action until the selection is valid.
- Preserve accessible labels, keyboard-operable chess squares, visible focus, mobile layouts, and reduced-motion support.

## Match Review and Tournament Visibility

### Missing behavior found

- Games save only the latest board state reliably; a review needs a durable move-by-move record.
- Only the two players can currently open a game, so club members cannot preview or review tournament matches.
- Tournament standings update in PostgreSQL, but the frontend does not subscribe to participant point changes.
- The tournament page has no complete match archive, result summary, or replay controls.

### Implementation

- Add a `game_moves` PostgreSQL table storing ply, SAN notation, source/destination squares, resulting FEN, clock values, and timestamp for every accepted move.
- Allow authenticated members of the tournament’s club to read tournament games and their moves; random games remain private to their two players. Spectators remain read-only.
- Return viewer role and ordered moves from the game endpoint so the same board supports playing, watching, and completed-game review.
- Add previous/next/start/end replay controls, move notation, result display, live spectator updates, and a clear “Review” state to the game screen. Engine evaluation and accuracy scoring are not part of this phase.
- Add every tournament game attempt to the tournament response and show a match archive visible to all club members, with an owner-specific review-desk heading.
- Publish `tournament_participants` changes through Supabase Realtime and reload standings whenever points, match results, or tournament status changes.
- Keep point calculation transactional: win 2, draw 1, loss 0; playoff matches do not alter league points.

## Verification

- Backend typecheck and tournament/username tests.
- Frontend production typecheck and Vite build.
- Desktop and mobile browser verification for authentication and tournament creation screens.
- Confirm no mock records, seed data, or development fallbacks exist.
- Verify replay navigation, spectator authorization, result labels, drawn knockout rematches, and realtime point refresh.
