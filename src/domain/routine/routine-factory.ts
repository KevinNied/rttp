import { Routine } from "@/lib/rttp-data";

export type RoutineTemplate = Omit<Routine, "athleteId"> & {
  coachId: number;
};

export function snapshotRoutine(rutina: Routine): Routine {
  return {
    ...rutina,
    structure: {
      sections: rutina.structure.sections.map((section) => ({
        ...section,
        exercises: section.exercises.map((exercise) => ({ ...exercise })),
      })),
    },
  };
}

export function rutinaDesdePlantilla(
  plantilla: RoutineTemplate,
  athleteId: number,
): Routine {
  const idBase = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    ...plantilla,
    id: `rutina-${athleteId}-${idBase}`,
    athleteId,
    structure: {
      sections: plantilla.structure.sections.map((section, sectionIndex) => ({
        ...section,
        id: `seccion-${idBase}-${sectionIndex}`,
        exercises: section.exercises.map((exercise, exerciseIndex) => ({
          ...exercise,
          id: `ejercicio-${idBase}-${sectionIndex}-${exerciseIndex}`,
        })),
      })),
    },
  };
}

export function idPlantilla(coachId: number) {
  return `plantilla-${coachId}-${Date.now()}`;
}

export function nuevaRutinaBase(): Omit<Routine, "athleteId"> {
  return {
    id: `rutina-${crypto.randomUUID()}`,
    title: "Nueva rutina",
    objective: "Entrenamiento personalizado",
    durationMinutes: null,
    structure: {
      sections: [
        {
          id: `seccion-${crypto.randomUUID()}`,
          name: "Sección 1",
          kind: "sequential",
          role: "custom",
          presentation: "standard",
          exercises: [],
        },
      ],
    },
  };
}
