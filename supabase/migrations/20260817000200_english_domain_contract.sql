create or replace function public.to_english_blocks(input_blocks jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      (
        block_data
        - 'nombre'
        - 'tipo'
        - 'ejercicios'
      ) || jsonb_build_object(
        'name', coalesce(block_data->'name', block_data->'nombre'),
        'type', case coalesce(block_data->>'type', block_data->>'tipo')
          when 'Series consecutivas' then 'consecutive-sets'
          when 'Preparación' then 'preparation'
          when 'Preparación específica' then 'specific-preparation'
          when 'Alternado' then 'alternating'
          when 'Cierre' then 'cooldown'
          when 'Circuito · 2 vueltas' then 'circuit-2-rounds'
          when 'Personalizado' then 'custom'
          when 'consecutive-sets' then 'consecutive-sets'
          when 'preparation' then 'preparation'
          when 'specific-preparation' then 'specific-preparation'
          when 'alternating' then 'alternating'
          when 'cooldown' then 'cooldown'
          when 'circuit-2-rounds' then 'circuit-2-rounds'
          else 'custom'
        end,
        'exercises', (
          select coalesce(
            jsonb_agg(
              (
                exercise_data
                - 'nombre'
                - 'aclaraciones'
                - 'series'
                - 'repeticionesMin'
                - 'repeticionesMax'
                - 'peso'
                - 'descanso'
              ) || jsonb_build_object(
                'name', coalesce(
                  exercise_data->'name',
                  exercise_data->'nombre'
                ),
                'instructions', coalesce(
                  exercise_data->'instructions',
                  exercise_data->'aclaraciones',
                  '""'::jsonb
                ),
                'sets', coalesce(
                  exercise_data->'sets',
                  exercise_data->'series',
                  '0'::jsonb
                ),
                'minReps', coalesce(
                  exercise_data->'minReps',
                  exercise_data->'repeticionesMin',
                  '0'::jsonb
                ),
                'maxReps', coalesce(
                  exercise_data->'maxReps',
                  exercise_data->'repeticionesMax',
                  '0'::jsonb
                ),
                'weight', coalesce(
                  exercise_data->'weight',
                  exercise_data->'peso',
                  '0'::jsonb
                ),
                'restSeconds', coalesce(
                  exercise_data->'restSeconds',
                  exercise_data->'descanso',
                  'null'::jsonb
                )
              )
            ),
            '[]'::jsonb
          )
          from jsonb_array_elements(
            coalesce(
              block_data->'exercises',
              block_data->'ejercicios',
              '[]'::jsonb
            )
          ) as exercise_data
        )
      )
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(coalesce(input_blocks, '[]'::jsonb)) as block_data;
$$;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.scheduled_workouts
  drop constraint if exists scheduled_workouts_status_check,
  drop constraint if exists scheduled_workouts_origin_check,
  drop constraint if exists scheduled_workouts_category_check,
  drop constraint if exists scheduled_workouts_check;

alter table public.workout_activities
  drop constraint if exists workout_activities_activity_type_check,
  drop constraint if exists workout_activities_category_check;

update public.profiles
set role = case role
  when 'entrenador' then 'coach'
  when 'atleta' then 'athlete'
  else role
end;

update public.scheduled_workouts
set
  status = case status
    when 'programado' then 'scheduled'
    when 'en-curso' then 'in-progress'
    when 'completado' then 'completed'
    when 'omitido' then 'skipped'
    else status
  end,
  origin = case origin
    when 'rutina' then 'routine'
    when 'externo' then 'external'
    else origin
  end,
  category = case category
    when 'natacion' then 'swimming'
    when 'ciclismo' then 'cycling'
    when 'deporte' then 'sport'
    when 'movilidad' then 'mobility'
    when 'otra' then 'other'
    else category
  end;

update public.workout_activities
set
  activity_type = case activity_type
    when 'rutina' then 'routine'
    when 'externa' then 'external'
    else activity_type
  end,
  category = case category
    when 'natacion' then 'swimming'
    when 'ciclismo' then 'cycling'
    when 'deporte' then 'sport'
    when 'movilidad' then 'mobility'
    when 'otra' then 'other'
    else category
  end;

update public.routines
set blocks = public.to_english_blocks(blocks);

update public.routine_templates
set blocks = public.to_english_blocks(blocks);

update public.workout_activities
set routine_snapshot = null
where routine_snapshot = 'null'::jsonb;

update public.workout_activities
set routine_snapshot = (
  routine_snapshot
  - 'atletaId'
  - 'titulo'
  - 'objetivo'
  - 'duracion'
  - 'bloques'
) || jsonb_build_object(
  'athleteId', coalesce(
    routine_snapshot->'athleteId',
    routine_snapshot->'atletaId'
  ),
  'title', coalesce(
    routine_snapshot->'title',
    routine_snapshot->'titulo'
  ),
  'objective', coalesce(
    routine_snapshot->'objective',
    routine_snapshot->'objetivo'
  ),
  'durationMinutes', coalesce(
    routine_snapshot->'durationMinutes',
    routine_snapshot->'duracion'
  ),
  'blocks', public.to_english_blocks(
    coalesce(
      routine_snapshot->'blocks',
      routine_snapshot->'bloques',
      '[]'::jsonb
    )
  )
)
where jsonb_typeof(routine_snapshot) = 'object';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('coach', 'athlete'));

alter table public.scheduled_workouts
  add constraint scheduled_workouts_status_check
  check (status in ('scheduled', 'in-progress', 'completed', 'skipped')),
  add constraint scheduled_workouts_origin_check
  check (origin in ('routine', 'external')),
  add constraint scheduled_workouts_category_check
  check (
    category is null or
    category in ('running', 'swimming', 'cycling', 'sport', 'mobility', 'other')
  ),
  add constraint scheduled_workouts_check
  check (
    (origin = 'routine' and routine_id is not null and title is null and category is null)
    or
    (origin = 'external' and routine_id is null and title is not null and category is not null)
  );

alter table public.workout_activities
  add constraint workout_activities_activity_type_check
  check (activity_type in ('routine', 'external')),
  add constraint workout_activities_category_check
  check (
    category is null or
    category in ('running', 'swimming', 'cycling', 'sport', 'mobility', 'other')
  );

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
    (activity->>'durationMinutes')::integer,
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
    block_id,
    block_name,
    round_number,
    weight,
    repetitions,
    skipped
  )
  select
    activity->>'id',
    value->>'stepId',
    value->>'exerciseId',
    value->>'exerciseName',
    value->>'blockId',
    value->>'blockName',
    (value->>'round')::integer,
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
    (activity->>'durationMinutes')::integer,
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
      block_id,
      block_name,
      round_number,
      weight,
      repetitions,
      skipped
    )
    select
      activity->>'id',
      value->>'stepId',
      value->>'exerciseId',
      value->>'exerciseName',
      value->>'blockId',
      value->>'blockName',
      (value->>'round')::integer,
      (value->>'weight')::numeric,
      (value->>'reps')::integer,
      (value->>'skipped')::boolean
    from jsonb_array_elements(coalesce(activity_sets, '[]'::jsonb))
    on conflict do nothing;
  end if;
end;
$$;

create or replace function public.migrate_profiles(local_profiles jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  profile_data jsonb;
  athlete_id_data jsonb;
  local_id bigint;
  target_id bigint;
  local_role text;
  existing_role text;
  mapped_athlete_id bigint;
  id_mapping jsonb := '{}'::jsonb;
begin
  perform pg_advisory_xact_lock(20260817);

  for profile_data in
    select value
    from jsonb_array_elements(coalesce(local_profiles, '[]'::jsonb))
  loop
    local_id := (profile_data->>'id')::bigint;
    local_role := profile_data->>'role';

    select id, role
    into target_id, existing_role
    from public.profiles
    where lower(email) = lower(profile_data->>'email');

    if found then
      if existing_role <> local_role then
        raise exception 'Profile role conflict for email %', profile_data->>'email';
      end if;
    else
      select role
      into existing_role
      from public.profiles
      where id = local_id;

      if found then
        select coalesce(max(id), 0) + 1
        into target_id
        from public.profiles;
      else
        target_id := local_id;
      end if;

      insert into public.profiles (id, name, email, role)
      values (
        target_id,
        profile_data->>'name',
        lower(profile_data->>'email'),
        local_role
      );
    end if;

    id_mapping := id_mapping || jsonb_build_object(local_id::text, target_id);
  end loop;

  for profile_data in
    select value
    from jsonb_array_elements(coalesce(local_profiles, '[]'::jsonb))
    where value->>'role' = 'coach'
  loop
    target_id := (id_mapping->>(profile_data->>'id'))::bigint;

    for athlete_id_data in
      select value
      from jsonb_array_elements(
        coalesce(profile_data->'athleteIds', '[]'::jsonb)
      )
    loop
      mapped_athlete_id := coalesce(
        (id_mapping->>(athlete_id_data#>>'{}'))::bigint,
        (athlete_id_data#>>'{}')::bigint
      );

      update public.profiles
      set athlete_ids = case
        when mapped_athlete_id = any(athlete_ids) then athlete_ids
        else array_append(athlete_ids, mapped_athlete_id)
      end
      where id = target_id and role = 'coach';
    end loop;
  end loop;

  return id_mapping;
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
    blocks
  )
  values (
    p_initial_routine->>'id',
    new_athlete_id,
    p_initial_routine->>'title',
    p_initial_routine->>'objective',
    (p_initial_routine->>'durationMinutes')::integer,
    coalesce(p_initial_routine->'blocks', '[]'::jsonb)
  );

  return new_athlete_id;
end;
$$;

drop function public.to_english_blocks(jsonb);
