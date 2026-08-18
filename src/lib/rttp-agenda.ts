export type ActivityCategory =
  | "running"
  | "swimming"
  | "cycling"
  | "sport"
  | "mobility"
  | "other";

export type WorkoutStatus =
  | "scheduled"
  | "in-progress"
  | "completed"
  | "skipped";

type WorkoutBase = {
  id: string;
  athleteId: number;
  date: string;
  time: string | null;
  durationMinutes: number | null;
  status: WorkoutStatus;
  createdById: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ScheduledWorkout =
  | (WorkoutBase & {
      origin: "routine";
      routineId: string;
      title: null;
      category: null;
    })
  | (WorkoutBase & {
      origin: "external";
      routineId: null;
      title: string;
      category: ActivityCategory;
    });

type WithoutMetadata<T> = T extends ScheduledWorkout
  ? Omit<T, "id" | "createdAt" | "updatedAt">
  : never;

export type NewScheduledWorkout =
  WithoutMetadata<ScheduledWorkout>;

export const activityCategories: {
  value: ActivityCategory;
  label: string;
}[] = [
  { value: "running", label: "Running" },
  { value: "swimming", label: "Natación" },
  { value: "cycling", label: "Ciclismo" },
  { value: "sport", label: "Deporte" },
  { value: "mobility", label: "Movilidad" },
  { value: "other", label: "Otra actividad" },
];

export function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function startOfWeek(date: string) {
  const base = new Date(`${date}T12:00:00`);
  const daysSinceMonday = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - daysSinceMonday);
  return localDate(base);
}

export function addDays(date: string, amount: number) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + amount);
  return localDate(nextDate);
}

export function createWorkoutId() {
  return `workout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
