import { ActivitySet } from "@/lib/rttp-activity";
import { Routine } from "@/lib/rttp-data";

import { pasosDeRutina } from "@/domain/routine/routine-steps";
import { TrainingSetRecords } from "@/domain/workout/workout-session";

export function activitySetsForSession(
  rutina: Routine,
  sesionId: string,
  registros: TrainingSetRecords,
): ActivitySet[] {
  return pasosDeRutina(rutina, sesionId).flatMap((paso): ActivitySet[] => {
    const registro = registros[paso.stepId];
    if (!registro || (!registro.completed && !registro.skipped)) {
      return [];
    }
    return [
      {
        stepId: paso.stepId,
        exerciseId: paso.id,
        exerciseName: paso.name,
        sectionId: paso.sectionId,
        sectionName: paso.sectionName,
        iteration: paso.round,
        weight: registro.weight,
        reps: registro.reps,
        skipped: registro.skipped,
      },
    ];
  });
}
