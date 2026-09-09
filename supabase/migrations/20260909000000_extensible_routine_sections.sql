begin;

lock table
  public.routines,
  public.routine_templates,
  public.workout_activities,
  public.workout_activity_sets
in access exclusive mode;

create function public.to_routine_structure(legacy_blocks jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select jsonb_build_object(
    'sections',
    coalesce(
      jsonb_agg(
        (legacy_block - 'type') ||
        jsonb_build_object(
          'exercises',
          coalesce(legacy_block->'exercises', '[]'::jsonb),
          'kind',
          case
            when jsonb_array_length(
              coalesce(legacy_block->'exercises', '[]'::jsonb)
            ) > 1 then 'rounds'
            else 'sequential'
          end,
          'role',
          case legacy_block->>'type'
            when 'preparation' then 'warmup'
            when 'specific-preparation' then 'activation'
            when 'cooldown' then 'cooldown'
            when 'custom' then 'custom'
            else 'main'
          end,
          'presentation',
          case
            when legacy_block->>'type' in (
              'preparation',
              'specific-preparation',
              'circuit-2-rounds'
            ) then 'compact'
            else 'standard'
          end
        )
        order by block_ordinality
      ),
      '[]'::jsonb
    )
  )
  from jsonb_array_elements(coalesce(legacy_blocks, '[]'::jsonb))
    with ordinality as blocks(legacy_block, block_ordinality);
$$;

alter table public.routines
  add column structure jsonb;

alter table public.routine_templates
  add column structure jsonb;

update public.routines
set structure = public.to_routine_structure(blocks);

update public.routine_templates
set structure = public.to_routine_structure(blocks);

update public.workout_activities
set routine_snapshot =
  (routine_snapshot - 'blocks') ||
  jsonb_build_object(
    'structure',
    public.to_routine_structure(routine_snapshot->'blocks')
  )
where routine_snapshot is not null
  and routine_snapshot ? 'blocks';

alter table public.routines
  alter column structure set default '{"sections":[]}'::jsonb,
  alter column structure set not null;

alter table public.routine_templates
  alter column structure set default '{"sections":[]}'::jsonb,
  alter column structure set not null;

create function public.is_valid_routine_structure(candidate jsonb)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  section jsonb;
begin
  if coalesce(jsonb_typeof(candidate), '') <> 'object'
    or coalesce(jsonb_typeof(candidate->'sections'), '') <> 'array'
  then
    return false;
  end if;

  for section in
    select value
    from jsonb_array_elements(candidate->'sections')
  loop
    if jsonb_typeof(section) <> 'object'
      or coalesce(section->>'kind', '') not in ('sequential', 'rounds')
      or coalesce(section->>'role', '') not in (
          'warmup',
          'activation',
          'main',
          'cooldown',
          'custom'
        )
      or coalesce(section->>'presentation', '') not in ('standard', 'compact')
      or coalesce(jsonb_typeof(section->'exercises'), '') <> 'array'
    then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

alter table public.routines
  add constraint routines_structure_check
  check (public.is_valid_routine_structure(structure));

alter table public.routine_templates
  add constraint routine_templates_structure_check
  check (public.is_valid_routine_structure(structure));

alter table public.workout_activities
  add constraint workout_activities_routine_snapshot_structure_check
  check (
    routine_snapshot is null
    or (
      not (routine_snapshot ? 'blocks')
      and public.is_valid_routine_structure(routine_snapshot->'structure')
    )
  );

alter table public.routines
  drop column blocks;

alter table public.routine_templates
  drop column blocks;

alter table public.workout_activity_sets
  rename column block_id to section_id;

alter table public.workout_activity_sets
  rename column block_name to section_name;

alter table public.workout_activity_sets
  rename column round_number to iteration_number;

create or replace function public.save_workout_activity(
  activity jsonb,
  activity_sets jsonb
)
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into public.workout_activities (
    id,
    athlete_id,
    scheduled_workout_id,
    activity_type,
    title,
    category,
    routine_id,
    routine_snapshot,
    activity_date,
    completed_at,
    duration_minutes,
    duration_seconds,
    effort,
    feedback,
    notes,
    registered_by_id
  )
  values (
    activity->>'id',
    (activity->>'athleteId')::bigint,
    activity->>'scheduledWorkoutId',
    activity->>'type',
    activity->>'title',
    activity->>'category',
    activity->>'routineId',
    nullif(activity->'routineSnapshot', 'null'::jsonb),
    (activity->>'date')::date,
    (activity->>'completedAt')::timestamptz,
    nullif(activity->>'durationMinutes', '')::integer,
    nullif(activity->>'durationSeconds', '')::integer,
    nullif(activity->>'effort', '')::integer,
    coalesce(activity->>'feedback', ''),
    coalesce(activity->>'notes', ''),
    (activity->>'recordedById')::bigint
  )
  on conflict (id) do update set
    athlete_id = excluded.athlete_id,
    scheduled_workout_id = excluded.scheduled_workout_id,
    activity_type = excluded.activity_type,
    title = excluded.title,
    category = excluded.category,
    routine_id = excluded.routine_id,
    routine_snapshot = excluded.routine_snapshot,
    activity_date = excluded.activity_date,
    completed_at = excluded.completed_at,
    duration_minutes = excluded.duration_minutes,
    duration_seconds = excluded.duration_seconds,
    effort = excluded.effort,
    feedback = excluded.feedback,
    notes = excluded.notes,
    registered_by_id = excluded.registered_by_id;

  delete from public.workout_activity_sets
  where activity_id = activity->>'id';

  insert into public.workout_activity_sets (
    activity_id,
    step_id,
    exercise_id,
    exercise_name,
    section_id,
    section_name,
    iteration_number,
    weight,
    repetitions,
    skipped
  )
  select
    activity->>'id',
    value->>'stepId',
    value->>'exerciseId',
    value->>'exerciseName',
    value->>'sectionId',
    value->>'sectionName',
    (value->>'iteration')::integer,
    (value->>'weight')::numeric,
    (value->>'reps')::integer,
    (value->>'skipped')::boolean
  from jsonb_array_elements(coalesce(activity_sets, '[]'::jsonb));
end;
$$;

create or replace function public.migrate_workout_activity(
  activity jsonb,
  activity_sets jsonb
)
returns void
language plpgsql
set search_path = public
as $$
declare
  inserted_activities integer;
begin
  insert into public.workout_activities (
    id,
    athlete_id,
    scheduled_workout_id,
    activity_type,
    title,
    category,
    routine_id,
    routine_snapshot,
    activity_date,
    completed_at,
    duration_minutes,
    duration_seconds,
    effort,
    feedback,
    notes,
    registered_by_id
  )
  values (
    activity->>'id',
    (activity->>'athleteId')::bigint,
    activity->>'scheduledWorkoutId',
    activity->>'type',
    activity->>'title',
    activity->>'category',
    activity->>'routineId',
    nullif(activity->'routineSnapshot', 'null'::jsonb),
    (activity->>'date')::date,
    (activity->>'completedAt')::timestamptz,
    nullif(activity->>'durationMinutes', '')::integer,
    nullif(activity->>'durationSeconds', '')::integer,
    nullif(activity->>'effort', '')::integer,
    coalesce(activity->>'feedback', ''),
    coalesce(activity->>'notes', ''),
    (activity->>'recordedById')::bigint
  )
  on conflict do nothing;

  get diagnostics inserted_activities = row_count;

  if inserted_activities = 1 then
    insert into public.workout_activity_sets (
      activity_id,
      step_id,
      exercise_id,
      exercise_name,
      section_id,
      section_name,
      iteration_number,
      weight,
      repetitions,
      skipped
    )
    select
      activity->>'id',
      value->>'stepId',
      value->>'exerciseId',
      value->>'exerciseName',
      value->>'sectionId',
      value->>'sectionName',
      (value->>'iteration')::integer,
      (value->>'weight')::numeric,
      (value->>'reps')::integer,
      (value->>'skipped')::boolean
    from jsonb_array_elements(coalesce(activity_sets, '[]'::jsonb))
    on conflict do nothing;
  end if;
end;
$$;

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
    when new_athlete_id = any(athlete_ids) then athlete_ids
    else array_append(athlete_ids, new_athlete_id)
  end
  where id = p_coach_id;

  insert into public.routines (
    id,
    athlete_id,
    title,
    objective,
    duration_minutes,
    structure
  )
  values (
    p_initial_routine->>'id',
    new_athlete_id,
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

drop function public.to_routine_structure(jsonb);

commit;
