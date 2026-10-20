"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

import {
  elapsedSecondsForTimer,
  type WorkoutTimerState,
} from "@/domain/workout/workout-session";
import { formatDuration } from "@/lib/format";

export function WorkoutElapsedTime({ timer }: { timer: WorkoutTimerState }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    elapsedSecondsForTimer(timer),
  );

  useEffect(() => {
    let timeoutId: number;
    const updateElapsedTime = () => {
      const nextElapsedSeconds = elapsedSecondsForTimer(timer);
      setElapsedSeconds((current) =>
        current === nextElapsedSeconds ? current : nextElapsedSeconds,
      );
    };
    const scheduleUpdate = () => {
      updateElapsedTime();
      timeoutId = window.setTimeout(scheduleUpdate, 250);
    };
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") updateElapsedTime();
    };

    scheduleUpdate();
    window.addEventListener("focus", updateElapsedTime);
    window.addEventListener("pageshow", updateElapsedTime);
    document.addEventListener("visibilitychange", syncWhenVisible);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("focus", updateElapsedTime);
      window.removeEventListener("pageshow", updateElapsedTime);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [timer]);

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 tabular-nums text-content-secondary"
      aria-label={`Tiempo transcurrido: ${formatDuration(elapsedSeconds)}`}
    >
      <Clock3 className="size-3" />
      {formatDuration(elapsedSeconds)}
    </span>
  );
}
