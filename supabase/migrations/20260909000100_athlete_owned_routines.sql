begin;

lock table
  public.profiles,
  public.routines,
  public.workout_activities
in share row exclusive mode;

alter table public.routines
  add column created_by_id bigint references public.profiles(id),
  add column shared_with_coach_id bigint references public.profiles(id)
    on delete set null,
  add column archived_at timestamptz;

update public.routines as routine
set created_by_id = case
  when routine.id = 'r1' and routine.athlete_id = 6 then 6
  when jsonb_typeof(routine.structure->'createdById') = 'number'
    then (routine.structure->>'createdById')::bigint
  else (
    select min(coach.id)
    from public.profiles as coach
    where coach.role = 'coach'
      and routine.athlete_id = any(coach.athlete_ids)
    having count(*) = 1
  )
end;

update public.routines
set
  shared_with_coach_id = case
    when jsonb_typeof(structure->'sharedWithCoachId') = 'number'
      then (structure->>'sharedWithCoachId')::bigint
    else null
  end,
  archived_at = case
    when jsonb_typeof(structure->'archivedAt') = 'string'
      then (structure->>'archivedAt')::timestamptz
    else null
  end,
  structure =
    structure - 'createdById' - 'sharedWithCoachId' - 'archivedAt';

do $$
begin
  if exists (
    select 1
    from public.routines
    where created_by_id is null
  ) then
    raise exception
      'Routine creator migration is ambiguous; assign created_by_id explicitly';
  end if;
end;
$$;

alter table public.routines
  alter column created_by_id set not null;

create index routines_created_by_id_idx
  on public.routines(created_by_id);

create index routines_shared_with_coach_id_idx
  on public.routines(shared_with_coach_id)
  where shared_with_coach_id is not null;

create index routines_active_athlete_id_idx
  on public.routines(athlete_id)
  where archived_at is null;

update public.workout_activities as activity
set routine_snapshot =
  activity.routine_snapshot ||
  jsonb_build_object(
    'createdById',
    routine.created_by_id,
    'sharedWithCoachId',
    null,
    'archivedAt',
    null
  )
from public.routines as routine
where activity.routine_id = routine.id
  and activity.routine_snapshot is not null;

create or replace function public.create_athlete_with_routine(
  p_coach_id bigint,
  p_athlete_name text,
  p_athlete_email text,
  p_initial_routine jsonb
)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  new_athlete_id bigint;
begin
  if not exists (
    select 1
    from public.profiles
    where id = p_coach_id and role = 'coach'
  ) then
    raise exception 'Coach profile not found';
  end if;

  perform pg_advisory_xact_lock(20260817);
  select coalesce(max(id), 0) + 1
  into new_athlete_id
  from public.profiles;

  insert into public.profiles (id, name, email, role)
  values (
    new_athlete_id,
    p_athlete_name,
    lower(p_athlete_email),
    'athlete'
  );

  update public.profiles
  set athlete_ids = case
    when new_athlete_id = any(coalesce(athlete_ids, '{}'::bigint[]))
      then coalesce(athlete_ids, '{}'::bigint[])
    else array_append(coalesce(athlete_ids, '{}'::bigint[]), new_athlete_id)
  end
  where id = p_coach_id;

  insert into public.routines (
    id,
    athlete_id,
    created_by_id,
    shared_with_coach_id,
    archived_at,
    title,
    objective,
    duration_minutes,
    structure
  )
  values (
    p_initial_routine->>'id',
    new_athlete_id,
    p_coach_id,
    null,
    null,
    p_initial_routine->>'title',
    p_initial_routine->>'objective',
    nullif(p_initial_routine->>'durationMinutes', '')::integer,
    coalesce(
      p_initial_routine->'structure',
      '{"sections":[]}'::jsonb
    )
  );

  return new_athlete_id;
end;
$$;

commit;
