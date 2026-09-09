import { ScheduledWorkout } from "@/lib/rttp-agenda";

import {
  TrainingSetRecords,
  WorkoutSessionState,
} from "@/domain/workout/workout-session";
import { workoutSessionStoragePrefix } from "@/infrastructure/storage/storage-keys";

function workoutSessionKey(workoutId: string) {
  return `${workoutSessionStoragePrefix}${workoutId}`;
}

export function readWorkoutSession(
  workoutId: string,
): WorkoutSessionState | null {
  if (typeof window === "undefined") return null;
  const storedValue = window.localStorage.getItem(workoutSessionKey(workoutId));
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as WorkoutSessionState;
    const valid =
      parsed.workoutId === workoutId &&
      typeof parsed.routineId === "string" &&
      Number.isInteger(parsed.athleteId) &&
      ["home", "workout", "final"].includes(parsed.phase) &&
      Number.isInteger(parsed.activeIndex) &&
      parsed.activeIndex >= 0 &&
      typeof parsed.records === "object" &&
      parsed.records !== null &&
      Number.isFinite(parsed.finishedElapsedSeconds) &&
      typeof parsed.feedback === "string";
    if (valid) return parsed;
  } catch {
    console.warn(`No se pudo leer la sesión de ${workoutId}.`);
  }

  console.warn(`Se reinició una sesión inválida para ${workoutId}.`);
  window.localStorage.removeItem(workoutSessionKey(workoutId));
  return null;
}

export function writeWorkoutSession(session: WorkoutSessionState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    workoutSessionKey(session.workoutId),
    JSON.stringify(session),
  );
}

export function clearWorkoutSession(workoutId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(workoutSessionKey(workoutId));
}

export function pruneWorkoutSessions(workouts: ScheduledWorkout[]) {
  const activeWorkoutIds = new Set(
    workouts
      .filter((workout) => workout.status === "in-progress")
      .map((workout) => workout.id),
  );
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(workoutSessionStoragePrefix)) continue;
    const workoutId = key.slice(workoutSessionStoragePrefix.length);
    if (!activeWorkoutIds.has(workoutId)) {
      window.localStorage.removeItem(key);
    }
  }
}

export function readWorkoutRecords(workouts: ScheduledWorkout[]) {
  return workouts.reduce<TrainingSetRecords>((records, workout) => {
    if (workout.status !== "in-progress") return records;
    const session = readWorkoutSession(workout.id);
    return session ? { ...records, ...session.records } : records;
  }, {});
}
