import { Exercise, Routine, SectionKind } from "@/lib/rttp-data";

import { iterationsForSection } from "@/domain/routine/routine-metrics";

export type RoutineStep = Exercise & {
  stepId: string;
  sectionId: string;
  sectionIndex: number;
  sectionName: string;
  sectionKind: SectionKind;
  round: number;
  rondas: number;
  posicion: number;
  ejerciciosEnRonda: number;
};

export function pasosDeRutina(
  rutina: Routine,
  sesionId = rutina.id,
): RoutineStep[] {
  const steps: RoutineStep[] = [];

  rutina.structure.sections.forEach((section, sectionIndex) => {
    if (section.kind === "sequential") {
      section.exercises.forEach((item, posicion) => {
        Array.from({ length: item.sets }, (_, setIndex) => {
          steps.push({
            ...item,
            stepId: `${sesionId}-${item.id}-${setIndex}`,
            sectionId: section.id,
            sectionIndex,
            sectionName: section.name,
            sectionKind: section.kind,
            round: setIndex + 1,
            rondas: item.sets,
            posicion,
            ejerciciosEnRonda: section.exercises.length,
          });
        });
      });
      return;
    }

    const rounds = iterationsForSection(section);
    Array.from({ length: rounds }, (_, roundIndex) =>
      section.exercises
        .filter((item) => item.sets > roundIndex)
        .forEach((item, posicion) => {
          steps.push({
            ...item,
            stepId: `${sesionId}-${item.id}-${roundIndex}`,
            sectionId: section.id,
            sectionIndex,
            sectionName: section.name,
            sectionKind: section.kind,
            round: roundIndex + 1,
            rondas: rounds,
            posicion,
            ejerciciosEnRonda: section.exercises.filter(
              (currentExercise) => currentExercise.sets > roundIndex,
            ).length,
          });
        }),
    );
  });

  return steps;
}
