create extension if not exists pgcrypto;

create type public.gender as enum ('male', 'female', 'non_binary', 'prefer_not_to_say');
create type public.club_visibility as enum ('public', 'private');
create type public.club_role as enum ('admin', 'member');
create type public.tournament_format as enum ('short', 'ipl');
create type public.lifecycle_status as enum ('draft', 'active', 'finished');
create type public.match_status as enum ('locked', 'ready', 'playing', 'finished');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  username text not null unique check (username ~ '^[a-z][a-z0-9_]{2,19}$'),
  age smallint not null check (age between 13 and 120),
  gender public.gender not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_profile_for_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, username, age, gender)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'username',
    (new.raw_user_meta_data->>'age')::smallint, (new.raw_user_meta_data->>'gender')::public.gender);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_profile_for_user();

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 60),
  slug text not null unique,
  visibility public.club_visibility not null,
  owner_id uuid not null references public.profiles(id),
  invite_code_hash text not null,
  created_at timestamptz not null default now()
);
create table public.club_members (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.club_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  format public.tournament_format not null,
  status public.lifecycle_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create table public.tournament_participants (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  seed smallint not null,
  points smallint not null default 0,
  wins smallint not null default 0,
  primary key (tournament_id, user_id)
);
create table public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  stage text not null,
  round smallint not null,
  position smallint not null,
  player1_id uuid not null references public.profiles(id),
  player2_id uuid not null references public.profiles(id),
  winner_id uuid references public.profiles(id),
  loser_id uuid references public.profiles(id),
  game_id uuid,
  status public.match_status not null default 'locked',
  attempt smallint not null default 0,
  player1_ready_at timestamptz,
  player2_ready_at timestamptz,
  unique (tournament_id, stage, round, position)
);
create table public.games (
  id uuid primary key default gen_random_uuid(),
  white_id uuid not null references public.profiles(id),
  black_id uuid not null references public.profiles(id),
  tournament_match_id uuid references public.tournament_matches(id),
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn text not null default '',
  white_ms integer not null default 600000,
  black_ms integer not null default 600000,
  last_move text,
  status text not null default 'active' check (status in ('active', 'finished')),
  result text check (result in ('1-0', '0-1', '1/2-1/2')),
  version integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  last_move_at timestamptz,
  finished_at timestamptz
);
alter table public.tournament_matches add constraint tournament_match_game_fk foreign key (game_id) references public.games(id);
create table public.matchmaking_queue (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.tournament_matches enable row level security;
alter table public.games enable row level security;
alter table public.matchmaking_queue enable row level security;

revoke all on public.profiles, public.clubs, public.club_members, public.tournaments,
  public.tournament_participants, public.tournament_matches, public.games, public.matchmaking_queue from anon;
revoke insert, update, delete on public.clubs, public.club_members, public.tournaments,
  public.tournament_participants, public.tournament_matches, public.games, public.matchmaking_queue from authenticated;
grant select (id, name, username) on public.profiles to authenticated;
grant select on public.clubs, public.club_members, public.tournaments, public.tournament_participants,
  public.tournament_matches, public.games to authenticated;

create or replace function public.is_club_member(target_club uuid, target_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.club_members where club_id = target_club and user_id = target_user
  );
$$;

create policy "signed in users see public profile fields" on public.profiles for select to authenticated using (true);
create policy "users see public or joined clubs" on public.clubs for select to authenticated using (
  visibility = 'public' or public.is_club_member(id, auth.uid())
);
create policy "members see memberships" on public.club_members for select to authenticated using (
  public.is_club_member(club_id, auth.uid())
);
create policy "members see tournaments" on public.tournaments for select to authenticated using (
  public.is_club_member(tournaments.club_id, auth.uid())
);
create policy "members see tournament players" on public.tournament_participants for select to authenticated using (
  exists (select 1 from public.tournaments t where t.id = tournament_id and public.is_club_member(t.club_id, auth.uid()))
);
create policy "members see tournament matches" on public.tournament_matches for select to authenticated using (
  exists (select 1 from public.tournaments t where t.id = tournament_id and public.is_club_member(t.club_id, auth.uid()))
);
create policy "players see their games" on public.games for select to authenticated using (auth.uid() in (white_id, black_id));

alter publication supabase_realtime add table public.games, public.tournament_matches, public.tournaments;

create index games_players_status_idx on public.games (white_id, black_id, status);
create index tournament_matches_progress_idx on public.tournament_matches (tournament_id, stage, round, status);
create index club_members_user_idx on public.club_members (user_id, club_id);
