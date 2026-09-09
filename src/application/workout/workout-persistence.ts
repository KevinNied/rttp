import { WorkoutSessionState } from "@/domain/workout/workout-session";
import {
  clearWorkoutSession,
  readWorkoutSession,
  writeWorkoutSession,
} from "@/infrastructure/workout/workout-session-repository";
import {
  clearWorkoutTimer,
  pauseWorkoutTimer,
  readWorkoutTimer,
  restartWorkoutTimer,
  resumeWorkoutTimer,
} from "@/infrastructure/workout/workout-timer-repository";

export const workoutPersistence = {
  clearSession: clearWorkoutSession,
  readSession: readWorkoutSession,
  writeSession: (session: WorkoutSessionState) => writeWorkoutSession(session),
  clearTimer: clearWorkoutTimer,
  pauseTimer: pauseWorkoutTimer,
  readTimer: readWorkoutTimer,
  restartTimer: restartWorkoutTimer,
  resumeTimer: resumeWorkoutTimer,
};
