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
