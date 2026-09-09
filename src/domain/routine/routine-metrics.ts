import { Exercise, Routine, RoutineSection } from "@/lib/rttp-data";

export function sectionKindLabel(kind: RoutineSection["kind"]) {
  return {
    sequential: "Ejercicio por ejercicio",
    rounds: "Por rondas",
  }[kind];
}

export function cantidadEjercicios({ structure }: Pick<Routine, "structure">) {
  return structure.sections.reduce(
    (total, section) => total + section.exercises.length,
    0,
  );
}

export function rutinaTieneEjercicios(rutina: Pick<Routine, "structure">) {
  return cantidadEjercicios(rutina) > 0;
}

export function repeticionesObjetivo(item: Exercise) {
  return item.minReps === item.maxReps
    ? `${item.minReps}`
    : `${item.minReps}–${item.maxReps}`;
}

export function iterationsForSection(section: RoutineSection) {
  return Math.max(0, ...section.exercises.map((item) => item.sets));
}
