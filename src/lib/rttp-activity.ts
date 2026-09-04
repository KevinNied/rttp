import { ActivityCategory } from "@/lib/rttp-agenda";
import { Routine } from "@/lib/rttp-data";

export type RoutineActivitySnapshot = Routine & {
  durationSeconds?: number;
};

export type ActivitySet = {
  stepId: string;
  exerciseId: string;
  exerciseName: string;
  blockId: string;
  blockName: string;
  round: number;
  weight: number;
  reps: number;
  skipped: boolean;
};

export type CompletedActivity = {
  id: string;
  athleteId: number;
  scheduledWorkoutId: string;
  type: "routine" | "external";
  title: string;
  category: ActivityCategory | null;
  routineId: string | null;
  routineSnapshot: RoutineActivitySnapshot | null;
  date: string;
  completedAt: string;
  durationMinutes: number | null;
  durationSeconds: number | null;
  effort: number | null;
  feedback: string;
  notes: string;
  sets: ActivitySet[];
  recordedById: number;
};

export function activityId(scheduledWorkoutId: string) {
  return `actividad-${scheduledWorkoutId}`;
}
