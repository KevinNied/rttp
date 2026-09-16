import { ActivityCategory } from "@/lib/rttp-agenda";
import { Routine } from "@/lib/rttp-data";

type WorkoutAnnotationBase = {
  id: string;
  text: string;
  createdAt: string;
};

export type WorkoutAnnotation =
  | (WorkoutAnnotationBase & {
      scope: "set";
      stepId: string;
      exerciseId: string;
      exerciseName: string;
      sectionId: string;
      sectionName: string;
      iteration: number;
    })
  | (WorkoutAnnotationBase & {
      scope: "exercise";
      exerciseId: string;
      exerciseName: string;
      sectionId: string;
      sectionName: string;
    })
  | (WorkoutAnnotationBase & {
      scope: "block";
      sectionId: string;
      sectionName: string;
    });

export type RoutineActivitySnapshot = Routine & {
  durationSeconds?: number;
  annotations?: WorkoutAnnotation[];
};

export type ActivitySet = {
  stepId: string;
  exerciseId: string;
  exerciseName: string;
  sectionId: string;
  sectionName: string;
  iteration: number;
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
  annotations?: WorkoutAnnotation[];
  sets: ActivitySet[];
  recordedById: number;
};

export function normalizeWorkoutAnnotations(
  value: unknown,
): WorkoutAnnotation[] {
  if (!Array.isArray(value)) return [];

  return value.filter((annotation): annotation is WorkoutAnnotation => {
    if (
      typeof annotation !== "object" ||
      annotation === null ||
      !("scope" in annotation) ||
      !("id" in annotation) ||
      !("text" in annotation) ||
      !("createdAt" in annotation) ||
      !("sectionId" in annotation) ||
      !("sectionName" in annotation) ||
      typeof annotation.id !== "string" ||
      typeof annotation.text !== "string" ||
      typeof annotation.createdAt !== "string" ||
      typeof annotation.sectionId !== "string" ||
      typeof annotation.sectionName !== "string"
    ) {
      return false;
    }

    if (annotation.scope === "block") return true;
    if (
      annotation.scope === "exercise" &&
      "exerciseId" in annotation &&
      "exerciseName" in annotation
    ) {
      return (
        typeof annotation.exerciseId === "string" &&
        typeof annotation.exerciseName === "string"
      );
    }
    if (
      annotation.scope === "set" &&
      "stepId" in annotation &&
      "exerciseId" in annotation &&
      "exerciseName" in annotation &&
      "iteration" in annotation
    ) {
      return (
        typeof annotation.stepId === "string" &&
        typeof annotation.exerciseId === "string" &&
        typeof annotation.exerciseName === "string" &&
        Number.isInteger(annotation.iteration) &&
        Number(annotation.iteration) > 0
      );
    }
    return false;
  });
}

export function activityId(scheduledWorkoutId: string) {
  return `actividad-${scheduledWorkoutId}`;
}
