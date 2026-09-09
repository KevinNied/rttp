export type TrainingSetRecord = {
  weight: number;
  reps: number;
  completed: boolean;
  skipped: boolean;
  deferred?: boolean;
};

export type TrainingSetRecords = Record<string, TrainingSetRecord>;

export type WorkoutPhase = "home" | "workout" | "final";

export type WorkoutTimerState = {
  elapsedSeconds: number;
  runningSince: string | null;
};

export type RestTimerState = {
  stepId: string;
  remainingSeconds: number;
  runningSince: string | null;
};

export type WorkoutSessionState = {
  workoutId: string;
  routineId: string;
  athleteId: number;
  phase: WorkoutPhase;
  activeIndex: number;
  records: TrainingSetRecords;
  finishedElapsedSeconds: number;
  feedback: string;
  restTimer: RestTimerState | null;
};

export function elapsedSecondsForTimer(timer: WorkoutTimerState) {
  const runningSeconds = timer.runningSince
    ? Math.max(
        0,
        Math.floor((Date.now() - Date.parse(timer.runningSince)) / 1000),
      )
    : 0;
  return timer.elapsedSeconds + runningSeconds;
}

export function remainingRestSeconds(restTimer: RestTimerState) {
  const runningSeconds = restTimer.runningSince
    ? Math.floor((Date.now() - Date.parse(restTimer.runningSince)) / 1000)
    : 0;
  return Math.max(0, restTimer.remainingSeconds - runningSeconds);
}

function sessionPrefix(sessionId: string) {
  return `${sessionId}-`;
}

export function recordsForSession(
  records: TrainingSetRecords,
  sessionId: string,
): TrainingSetRecords {
  return Object.fromEntries(
    Object.entries(records).filter(([key]) =>
      key.startsWith(sessionPrefix(sessionId)),
    ),
  );
}

export function recordsWithoutSession(
  records: TrainingSetRecords,
  sessionId: string,
): TrainingSetRecords {
  return Object.fromEntries(
    Object.entries(records).filter(
      ([key]) => !key.startsWith(sessionPrefix(sessionId)),
    ),
  );
}

export function recordsWithoutSessions(
  records: TrainingSetRecords,
  sessionIds: readonly string[],
): TrainingSetRecords {
  return Object.fromEntries(
    Object.entries(records).filter(
      ([key]) =>
        !sessionIds.some((sessionId) =>
          key.startsWith(sessionPrefix(sessionId)),
        ),
    ),
  );
}

export function completedSetsForSession(
  records: TrainingSetRecords,
  sessionId: string,
) {
  return Object.entries(records).filter(
    ([key, value]) => key.startsWith(sessionPrefix(sessionId)) && value.completed,
  ).length;
}
