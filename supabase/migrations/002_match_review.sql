create table public.game_moves (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  ply integer not null check (ply > 0),
  san text not null,
  from_square text not null check (from_square ~ '^[a-h][1-8]$'),
  to_square text not null check (to_square ~ '^[a-h][1-8]$'),
  fen_after text not null,
  white_ms integer not null,
  black_ms integer not null,
  played_at timestamptz not null default now(),
  unique (game_id, ply)
);

alter table public.game_moves enable row level security;
revoke all on public.game_moves from anon;
revoke insert, update, delete on public.game_moves from authenticated;
grant select on public.game_moves to authenticated;

drop policy "players see their games" on public.games;
create policy "players and tournament club members see games" on public.games for select to authenticated using (
  auth.uid() in (white_id, black_id)
  or (
    tournament_match_id is not null
    and exists (
      select 1
      from public.tournament_matches tm
      join public.tournaments t on t.id = tm.tournament_id
      where tm.id = tournament_match_id
        and public.is_club_member(t.club_id, auth.uid())
    )
  )
);

create policy "authorized viewers see game moves" on public.game_moves for select to authenticated using (
  exists (
    select 1 from public.games g
    where g.id = game_id
      and (
        auth.uid() in (g.white_id, g.black_id)
        or (
          g.tournament_match_id is not null
          and exists (
            select 1
            from public.tournament_matches tm
            join public.tournaments t on t.id = tm.tournament_id
            where tm.id = g.tournament_match_id
              and public.is_club_member(t.club_id, auth.uid())
          )
        )
      )
  )
);

alter publication supabase_realtime add table public.tournament_participants;

create index game_moves_game_ply_idx on public.game_moves (game_id, ply);
