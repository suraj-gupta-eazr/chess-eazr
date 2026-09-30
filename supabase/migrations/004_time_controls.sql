alter table public.games drop constraint if exists games_time_control_ms_check;
alter table public.matchmaking_queue drop constraint if exists matchmaking_queue_time_control_ms_check;

update public.games
set time_control_ms = 300000,
    white_ms = white_ms + 120000,
    black_ms = black_ms + 120000
where time_control_ms = 180000 and status = 'active';

update public.games set time_control_ms = 300000 where time_control_ms = 180000;
update public.matchmaking_queue set time_control_ms = 300000 where time_control_ms = 180000;

alter table public.games add constraint games_time_control_ms_check
  check (time_control_ms in (300000, 600000, 900000, 1800000));
alter table public.matchmaking_queue add constraint matchmaking_queue_time_control_ms_check
  check (time_control_ms in (300000, 600000, 900000, 1800000));
