"use client";

import { useCallback, useSyncExternalStore } from "react";

import { elapsedSecondsForTimer } from "@/domain/workout/workout-session";
import { workoutPersistence } from "@/application/workout/workout-persistence";

export function useWorkoutElapsedSeconds(workoutId: string | null) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!workoutId) return () => {};

      const interval = window.setInterval(onChange, 1000);
      window.addEventListener("storage", onChange);
      window.addEventListener("focus", onChange);
      window.addEventListener("pageshow", onChange);
      document.addEventListener("visibilitychange", onChange);

      return () => {
        window.clearInterval(interval);
        window.removeEventListener("storage", onChange);
        window.removeEventListener("focus", onChange);
        window.removeEventListener("pageshow", onChange);
        document.removeEventListener("visibilitychange", onChange);
      };
    },
    [workoutId],
  );
  const getSnapshot = useCallback(() => {
    const timer = workoutId ? workoutPersistence.readTimer(workoutId) : null;
    return timer ? elapsedSecondsForTimer(timer) : null;
  }, [workoutId]);

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
