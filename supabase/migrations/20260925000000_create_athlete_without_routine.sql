begin;

create or replace function public.create_athlete(
  p_coach_id bigint,
  p_athlete_name text,
  p_athlete_email text
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

  return new_athlete_id;
end;
$$;

grant execute on function public.create_athlete(bigint, text, text)
to anon, authenticated;

commit;

