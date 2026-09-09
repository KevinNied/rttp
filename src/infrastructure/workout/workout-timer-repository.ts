import { ScheduledWorkout } from "@/lib/rttp-agenda";

import {
  elapsedSecondsForTimer,
  WorkoutTimerState,
} from "@/domain/workout/workout-session";
import { workoutTimerStoragePrefix } from "@/infrastructure/storage/storage-keys";

function workoutTimerKey(workoutId: string) {
  return `${workoutTimerStoragePrefix}${workoutId}`;
}

export function readWorkoutTimer(workoutId: string): WorkoutTimerState | null {
  if (typeof window === "undefined") return null;
  const key = workoutTimerKey(workoutId);
  const storedValue = window.localStorage.getItem(key);
  if (!storedValue) return null;

  if (!Number.isNaN(Date.parse(storedValue))) {
    return { elapsedSeconds: 0, runningSince: storedValue };
  }

  try {
    const parsed = JSON.parse(storedValue) as WorkoutTimerState;
    const validElapsed =
      Number.isFinite(parsed.elapsedSeconds) && parsed.elapsedSeconds >= 0;
    const validRunningSince =
      parsed.runningSince === null ||
      (typeof parsed.runningSince === "string" &&
        !Number.isNaN(Date.parse(parsed.runningSince)));
    if (validElapsed && validRunningSince) return parsed;
  } catch {
    console.warn(`No se pudo leer el cronómetro de ${workoutId}.`);
  }

  console.warn(`Se reinició un cronómetro inválido para ${workoutId}.`);
  window.localStorage.removeItem(key);
  return null;
}

function writeWorkoutTimer(workoutId: string, timer: WorkoutTimerState) {
  if (typeof window === "undefined") return timer;
  window.localStorage.setItem(
    workoutTimerKey(workoutId),
    JSON.stringify(timer),
  );
  return timer;
}

export function resumeWorkoutTimer(workoutId: string) {
  const current = readWorkoutTimer(workoutId);
  if (current?.runningSince) return current;
  return writeWorkoutTimer(workoutId, {
    elapsedSeconds: current?.elapsedSeconds ?? 0,
    runningSince: new Date().toISOString(),
  });
}

export function pauseWorkoutTimer(workoutId: string) {
  const current = readWorkoutTimer(workoutId);
  if (!current) return 0;
  const elapsedSeconds = elapsedSecondsForTimer(current);
  writeWorkoutTimer(workoutId, { elapsedSeconds, runningSince: null });
  return elapsedSeconds;
}

export function restartWorkoutTimer(workoutId: string) {
  return writeWorkoutTimer(workoutId, {
    elapsedSeconds: 0,
    runningSince: new Date().toISOString(),
  });
}

export function clearWorkoutTimer(workoutId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(workoutTimerKey(workoutId));
}

export function pruneWorkoutTimers(workouts: ScheduledWorkout[]) {
  const activeWorkoutIds = new Set(
    workouts
      .filter((workout) => workout.status === "in-progress")
      .map((workout) => workout.id),
  );
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(workoutTimerStoragePrefix)) continue;
    const workoutId = key.slice(workoutTimerStoragePrefix.length);
    if (!activeWorkoutIds.has(workoutId)) window.localStorage.removeItem(key);
  }
}
