"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import type { Exercise, Routine } from "@/lib/rttp-data";
import { routineExerciseEntries } from "@/domain/routine/routine-structure";
import { FilaEjercicio } from "@/features/routine-editor/exercise-row";

export function SequentialExerciseEditor({
  routine,
  onUpdateExercise,
  onDeleteExercise,
  onAddExercise,
}: {
  routine: Routine;
  onUpdateExercise: (sectionId: string, exerciseId: string, next: Exercise) => void;
  onDeleteExercise: (sectionId: string, exerciseId: string) => void;
  onAddExercise: () => void;
}) {
  const entries = routineExerciseEntries(routine);

  return (
    <div aria-label="Ejercicios de la rutina">
      <SortableContext
        items={entries.map(({ exercise }) => exercise.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="py-1">
          {entries.map(({ sectionId, exercise }) => (
            <FilaEjercicio
              key={exercise.id}
              item={exercise}
              sectionId={sectionId}
              onUpdate={(next) => onUpdateExercise(sectionId, exercise.id, next)}
              onDelete={() => onDeleteExercise(sectionId, exercise.id)}
            />
          ))}
        </div>
      </SortableContext>
      <div className="p-3">
        <button
          type="button"
          onClick={onAddExercise}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-200/15 bg-cyan-300/[0.025] px-4 py-3 text-xs text-cyan-100/55 transition-colors hover:border-cyan-200/30 hover:bg-cyan-300/[0.06] hover:text-cyan-100"
        >
          <Plus className="size-3.5" />
          Sumar ejercicio
        </button>
      </div>
    </div>
  );
}
