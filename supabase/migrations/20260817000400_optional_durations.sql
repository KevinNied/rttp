alter table public.routines
  alter column duration_minutes drop not null;

alter table public.routine_templates
  alter column duration_minutes drop not null;

alter table public.scheduled_workouts
  alter column duration_minutes drop not null;

alter table public.workout_activities
  alter column duration_minutes drop not null;
