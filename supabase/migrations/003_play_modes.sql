alter table public.games
  add column time_control_ms integer not null default 600000
    check (time_control_ms in (180000, 300000, 600000)),
  add column bot_side text check (bot_side in ('black'));

alter table public.matchmaking_queue
  add column time_control_ms integer not null default 600000
    check (time_control_ms in (180000, 300000, 600000));

create index matchmaking_queue_time_idx on public.matchmaking_queue (time_control_ms, joined_at);
