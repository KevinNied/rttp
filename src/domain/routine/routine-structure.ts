import type { Routine } from "@/lib/rttp-data";

type StructuredRoutine = Pick<Routine, "structure">;

export function isSequentialRoutine(routine: StructuredRoutine) {
  return routine.structure.sections.every(
    (section) => section.kind === "sequential",
  );
}

export function routineExerciseEntries(routine: StructuredRoutine) {
  return routine.structure.sections.flatMap((section) =>
    section.exercises.map((exercise) => ({
      sectionId: section.id,
      exercise,
    })),
  );
}

export function moveSequentialExercise(
  routine: Routine,
  exerciseId: string,
  targetId: string,
): Routine {
  if (!isSequentialRoutine(routine) || exerciseId === targetId) return routine;

  const entries = routineExerciseEntries(routine);
  const from = entries.findIndex(({ exercise }) => exercise.id === exerciseId);
  const to = entries.findIndex(({ exercise }) => exercise.id === targetId);
  if (from < 0 || to < 0) return routine;

  const source = entries[from];
  const target = entries[to];
  return {
    ...routine,
    structure: {
      ...routine.structure,
      sections: routine.structure.sections.map((section) => {
        const sourceIndex = section.exercises.findIndex(
          (exercise) => exercise.id === exerciseId,
        );
        const targetIndex = section.exercises.findIndex(
          (exercise) => exercise.id === targetId,
        );
        if (section.id === source.sectionId && section.id === target.sectionId) {
          const exercises = [...section.exercises];
          exercises.splice(sourceIndex, 1);
          exercises.splice(targetIndex, 0, source.exercise);
          return { ...section, exercises };
        }
        if (section.id === source.sectionId) {
          return {
            ...section,
            exercises: section.exercises.filter(
              (exercise) => exercise.id !== exerciseId,
            ),
          };
        }
        if (section.id === target.sectionId) {
          const exercises = [...section.exercises];
          exercises.splice(targetIndex + (from < to ? 1 : 0), 0, source.exercise);
          return { ...section, exercises };
        }
        return section;
      }),
    },
  };
}
