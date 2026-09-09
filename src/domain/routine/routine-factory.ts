import { Routine } from "@/lib/rttp-data";

export type RoutineTemplate = Omit<
  Routine,
  "athleteId" | "createdById" | "sharedWithCoachId" | "archivedAt"
> & {
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
  createdById: number,
): Routine {
  const idBase = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: `rutina-${athleteId}-${idBase}`,
    athleteId,
    createdById,
    sharedWithCoachId: null,
    archivedAt: null,
    title: plantilla.title,
    objective: plantilla.objective,
    durationMinutes: plantilla.durationMinutes,
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

export function nuevaRutinaBase(
  createdById: number,
): Omit<Routine, "athleteId"> {
  return {
    id: `rutina-${crypto.randomUUID()}`,
    createdById,
    sharedWithCoachId: null,
    archivedAt: null,
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

export function duplicateRoutineForAthlete(
  routine: Routine,
  athleteId: number,
): Routine {
  const copy = snapshotRoutine(routine);
  const idBase = crypto.randomUUID();

  return {
    ...copy,
    id: `rutina-${athleteId}-${idBase}`,
    athleteId,
    createdById: athleteId,
    sharedWithCoachId: null,
    archivedAt: null,
    title: `${routine.title} (copia)`,
    structure: {
      sections: copy.structure.sections.map((section, sectionIndex) => ({
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
