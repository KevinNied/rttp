"use client";

import { useState } from "react";
import {
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { Exercise, Routine, SectionKind } from "@/lib/rttp-data";

export function useRoutineEditor(rutinaGuardada: Routine) {
  const [rutina, setRutina] = useState(rutinaGuardada);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function actualizarEjercicio(
    sectionId: string,
    exerciseId: string,
    siguiente: Exercise,
  ) {
    setRutina((actual) => ({
      ...actual,
      structure: {
        ...actual.structure,
        sections: actual.structure.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                exercises: section.exercises.map((item) =>
                  item.id === exerciseId ? siguiente : item,
                ),
              }
            : section,
        ),
      },
    }));
  }

  function eliminarEjercicio(sectionId: string, exerciseId: string) {
    setRutina((actual) => ({
      ...actual,
      structure: {
        ...actual.structure,
        sections: actual.structure.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                exercises: section.exercises.filter(
                  (item) => item.id !== exerciseId,
                ),
              }
            : section,
        ),
      },
    }));
  }

  function updateSectionKind(sectionId: string, kind: SectionKind) {
    setRutina((current) => ({
      ...current,
      structure: {
        ...current.structure,
        sections: current.structure.sections.map((section) =>
          section.id === sectionId ? { ...section, kind } : section,
        ),
      },
    }));
  }

  function agregarEjercicio(
    item: Exercise,
    sectionId: string,
    newSectionName?: string,
    newSectionKind: SectionKind = "sequential",
  ) {
    if (sectionId === "nuevo" && newSectionName) {
      const id = `seccion-${crypto.randomUUID()}`;
      setRutina((actual) => ({
        ...actual,
        structure: {
          ...actual.structure,
          sections: [
            ...actual.structure.sections,
            {
              id,
              name: newSectionName,
              kind: newSectionKind,
              role: "custom",
              presentation: "standard",
              exercises: [item],
            },
          ],
        },
      }));
      setOpenSectionId(id);
      return;
    }

    setRutina((actual) => ({
      ...actual,
      structure: {
        ...actual.structure,
        sections: actual.structure.sections.map((section) =>
          section.id === sectionId
            ? { ...section, exercises: [...section.exercises, item] }
            : section,
        ),
      },
    }));
    setOpenSectionId(sectionId);
  }

  function agregarEjercicioVacio(sectionId: string) {
    const ejercicioSinNombre = rutina.structure.sections
      .find((section) => section.id === sectionId)
      ?.exercises.find((exercise) => !exercise.name.trim());

    if (ejercicioSinNombre) {
      setOpenSectionId(sectionId);
      window.requestAnimationFrame(() => {
        document
          .getElementById(`exercise-name-${ejercicioSinNombre.id}`)
          ?.focus();
      });
      return;
    }

    const item: Exercise = {
      id: `ejercicio-${crypto.randomUUID()}`,
      name: "",
      instructions: "",
      sets: 3,
      minReps: 10,
      maxReps: 10,
      weight: 0,
      restSeconds: null,
    };

    agregarEjercicio(item, sectionId);
  }

  function moverEjercicio(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const originSectionId = active.data.current?.sectionId as
      string | undefined;
    const destinationSectionId = (
      String(over.id).startsWith("seccion:")
        ? String(over.id).replace("seccion:", "")
        : over.data.current?.sectionId
    ) as string | undefined;

    if (!originSectionId || !destinationSectionId) return;

    setRutina((actual) => {
      const originSection = actual.structure.sections.find(
        (section) => section.id === originSectionId,
      );
      const destinationSection = actual.structure.sections.find(
        (section) => section.id === destinationSectionId,
      );
      if (!originSection || !destinationSection) return actual;

      const indiceOrigen = originSection.exercises.findIndex(
        (item) => item.id === active.id,
      );
      if (indiceOrigen < 0) return actual;

      if (originSectionId === destinationSectionId) {
        const indiceDestino = String(over.id).startsWith("seccion:")
          ? originSection.exercises.length - 1
          : originSection.exercises.findIndex((item) => item.id === over.id);
        if (indiceDestino < 0 || indiceDestino === indiceOrigen) return actual;
        return {
          ...actual,
          structure: {
            ...actual.structure,
            sections: actual.structure.sections.map((section) =>
              section.id === originSectionId
                ? {
                    ...section,
                    exercises: arrayMove(
                      section.exercises,
                      indiceOrigen,
                      indiceDestino,
                    ),
                  }
                : section,
            ),
          },
        };
      }

      const itemMovido = originSection.exercises[indiceOrigen];
      const indiceDestino = String(over.id).startsWith("seccion:")
        ? destinationSection.exercises.length
        : Math.max(
            0,
            destinationSection.exercises.findIndex(
              (item) => item.id === over.id,
            ),
          );

      return {
        ...actual,
        structure: {
          ...actual.structure,
          sections: actual.structure.sections.map((section) => {
            if (section.id === originSectionId) {
              return {
                ...section,
                exercises: section.exercises.filter(
                  (item) => item.id !== active.id,
                ),
              };
            }
            if (section.id === destinationSectionId) {
              const exercises = [...section.exercises];
              exercises.splice(indiceDestino, 0, itemMovido);
              return { ...section, exercises };
            }
            return section;
          }),
        },
      };
    });
    setOpenSectionId(destinationSectionId);
  }

  return {
    rutina,
    setRutina,
    openSectionId,
    setOpenSectionId,
    sensors,
    actualizarEjercicio,
    eliminarEjercicio,
    updateSectionKind,
    agregarEjercicio,
    agregarEjercicioVacio,
    moverEjercicio,
  };
}

export type RoutineEditor = ReturnType<typeof useRoutineEditor>;
