create table public.profiles (
  id bigint primary key,
  auth_user_id uuid unique,
  name text not null,
  email text not null unique,
  role text not null check (role in ('entrenador', 'atleta')),
  athlete_ids bigint[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routines (
  id text primary key,
  athlete_id bigint not null references public.profiles(id) on delete cascade,
  title text not null,
  objective text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index routines_athlete_id_idx on public.routines(athlete_id);

create table public.routine_templates (
  id text primary key,
  coach_id bigint not null references public.profiles(id) on delete cascade,
  title text not null,
  objective text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index routine_templates_coach_id_idx
  on public.routine_templates(coach_id);

create table public.scheduled_workouts (
  id text primary key,
  athlete_id bigint not null references public.profiles(id) on delete cascade,
  workout_date date not null,
  workout_time time,
  duration_minutes integer not null check (duration_minutes > 0),
  status text not null check (
    status in ('programado', 'en-curso', 'completado', 'omitido')
  ),
  created_by_id bigint not null references public.profiles(id),
  notes text not null default '',
  origin text not null check (origin in ('rutina', 'externo')),
  routine_id text references public.routines(id) on delete cascade,
  title text,
  category text check (
    category is null or
    category in ('running', 'natacion', 'ciclismo', 'deporte', 'movilidad', 'otra')
  ),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  check (
    (origin = 'rutina' and routine_id is not null and title is null and category is null)
    or
    (origin = 'externo' and routine_id is null and title is not null and category is not null)
  )
);

create index scheduled_workouts_athlete_date_idx
  on public.scheduled_workouts(athlete_id, workout_date);

create table public.workout_activities (
  id text primary key,
  athlete_id bigint not null references public.profiles(id) on delete cascade,
  scheduled_workout_id text not null unique,
  activity_type text not null check (activity_type in ('rutina', 'externa')),
  title text not null,
  category text check (
    category is null or
    category in ('running', 'natacion', 'ciclismo', 'deporte', 'movilidad', 'otra')
  ),
  routine_id text,
  routine_snapshot jsonb,
  activity_date date not null,
  completed_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  effort integer check (effort is null or effort between 1 and 5),
  feedback text not null default '',
  notes text not null default '',
  registered_by_id bigint not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_activities_athlete_date_idx
  on public.workout_activities(athlete_id, activity_date desc);

create table public.workout_activity_sets (
  activity_id text not null references public.workout_activities(id) on delete cascade,
  step_id text not null,
  exercise_id text not null,
  exercise_name text not null,
  block_id text not null,
  block_name text not null,
  round_number integer not null check (round_number > 0),
  weight numeric not null check (weight >= 0),
  repetitions integer not null check (repetitions >= 0),
  skipped boolean not null default false,
  primary key (activity_id, step_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger routines_set_updated_at
before update on public.routines
for each row execute function public.set_updated_at();

create trigger routine_templates_set_updated_at
before update on public.routine_templates
for each row execute function public.set_updated_at();

create trigger workout_activities_set_updated_at
before update on public.workout_activities
for each row execute function public.set_updated_at();

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
    activity->>'entrenamientoProgramadoId',
    activity->>'tipo',
    activity->>'titulo',
    activity->>'categoria',
    activity->>'rutinaId',
    activity->'rutinaSnapshot',
    (activity->>'fecha')::date,
    (activity->>'completadaEn')::timestamptz,
    (activity->>'duracionMinutos')::integer,
    nullif(activity->>'esfuerzo', '')::integer,
    coalesce(activity->>'feedback', ''),
    coalesce(activity->>'notas', ''),
    (activity->>'registradaPorId')::bigint
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
    value->>'pasoId',
    value->>'ejercicioId',
    value->>'ejercicioNombre',
    value->>'bloqueId',
    value->>'bloqueNombre',
    (value->>'ronda')::integer,
    (value->>'peso')::numeric,
    (value->>'repeticiones')::integer,
    (value->>'omitida')::boolean
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
    activity->>'entrenamientoProgramadoId',
    activity->>'tipo',
    activity->>'titulo',
    activity->>'categoria',
    activity->>'rutinaId',
    activity->'rutinaSnapshot',
    (activity->>'fecha')::date,
    (activity->>'completadaEn')::timestamptz,
    (activity->>'duracionMinutos')::integer,
    nullif(activity->>'esfuerzo', '')::integer,
    coalesce(activity->>'feedback', ''),
    coalesce(activity->>'notas', ''),
    (activity->>'registradaPorId')::bigint
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
      value->>'pasoId',
      value->>'ejercicioId',
      value->>'ejercicioNombre',
      value->>'bloqueId',
      value->>'bloqueNombre',
      (value->>'ronda')::integer,
      (value->>'peso')::numeric,
      (value->>'repeticiones')::integer,
      (value->>'omitida')::boolean
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
    local_role := profile_data->>'rol';

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
        profile_data->>'nombre',
        lower(profile_data->>'email'),
        local_role
      );
    end if;

    id_mapping := id_mapping || jsonb_build_object(local_id::text, target_id);
  end loop;

  for profile_data in
    select value
    from jsonb_array_elements(coalesce(local_profiles, '[]'::jsonb))
    where value->>'rol' = 'entrenador'
  loop
    target_id := (id_mapping->>(profile_data->>'id'))::bigint;

    for athlete_id_data in
      select value
      from jsonb_array_elements(
        coalesce(profile_data->'atletaIds', '[]'::jsonb)
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
      where id = target_id and role = 'entrenador';
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
    where id = p_coach_id and role = 'entrenador'
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
    'atleta'
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
    p_initial_routine->>'titulo',
    p_initial_routine->>'objetivo',
    (p_initial_routine->>'duracion')::integer,
    coalesce(p_initial_routine->'bloques', '[]'::jsonb)
  );

  return new_athlete_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.routines enable row level security;
alter table public.routine_templates enable row level security;
alter table public.scheduled_workouts enable row level security;
alter table public.workout_activities enable row level security;
alter table public.workout_activity_sets enable row level security;

-- Temporary policies while RTTP intentionally operates without Supabase Auth.
-- Replace these policies with ownership-based rules before introducing auth.
create policy "temporary public profiles access"
on public.profiles for all to anon, authenticated
using (true) with check (true);

create policy "temporary public routines access"
on public.routines for all to anon, authenticated
using (true) with check (true);

create policy "temporary public templates access"
on public.routine_templates for all to anon, authenticated
using (true) with check (true);

create policy "temporary public scheduled workouts access"
on public.scheduled_workouts for all to anon, authenticated
using (true) with check (true);

create policy "temporary public activities access"
on public.workout_activities for all to anon, authenticated
using (true) with check (true);

create policy "temporary public activity sets access"
on public.workout_activity_sets for all to anon, authenticated
using (true) with check (true);

grant select, insert, update, delete
on public.profiles,
   public.routines,
   public.routine_templates,
   public.scheduled_workouts,
   public.workout_activities,
   public.workout_activity_sets
to anon, authenticated;

grant execute on function public.save_workout_activity(jsonb, jsonb)
to anon, authenticated;

grant execute on function public.migrate_workout_activity(jsonb, jsonb)
to anon, authenticated;

grant execute on function public.migrate_profiles(jsonb)
to anon, authenticated;

grant execute on function public.create_athlete_with_routine(
  bigint,
  text,
  text,
  jsonb
) to anon, authenticated;
