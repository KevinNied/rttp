"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown } from "lucide-react";

import { countLabel } from "@/lib/format";
import { RoutineSection, SectionKind } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

import { sectionKindLabel } from "@/domain/routine/routine-metrics";

export function SeccionEditor({
  section,
  index,
  abierto,
  onToggle,
  onKindChange,
  addExercise,
  children,
}: {
  section: RoutineSection;
  index: number;
  abierto: boolean;
  onToggle: () => void;
  onKindChange: (kind: SectionKind) => void;
  addExercise: React.ReactNode;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `seccion:${section.id}`,
    data: { sectionId: section.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-shadow",
        isOver && "relative z-10 ring-1 ring-inset ring-cyan-300/45",
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 text-left transition-colors xl:px-5 xl:py-4",
          index % 2 === 0
            ? "bg-blue-400/[0.045] hover:bg-blue-400/[0.09]"
            : "bg-violet-400/[0.045] hover:bg-violet-400/[0.09]",
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid size-7 place-items-center rounded-full text-xs font-semibold text-indigo-950",
              index % 3 === 0
                ? "bg-cyan-300"
                : index % 3 === 1
                  ? "bg-violet-300"
                  : "bg-blue-300",
            )}
          >
            {index + 1}
          </span>
          <span className="text-sm font-medium">{section.name}</span>
          <span className="hidden text-xs text-white/55 sm:inline">
            {sectionKindLabel(section.kind)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-white/55">
            {countLabel(section.exercises.length, "ejercicio")}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-white/25 transition-transform",
              abierto && "rotate-180",
            )}
          />
        </div>
      </button>
      {abierto && (
        <>
          <div className="grid grid-cols-2 gap-2 border-y border-white/[0.05] bg-black/10 px-3 py-3">
            {(["sequential", "rounds"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={section.kind === kind}
                onClick={() => onKindChange(kind)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition-colors",
                  section.kind === kind
                    ? "border-cyan-200/25 bg-cyan-300/[0.08] text-cyan-50"
                    : "border-white/[0.07] bg-white/[0.025] text-white/40 hover:text-white/70",
                )}
              >
                <span className="block text-sm font-medium">
                  {kind === "sequential" ? "Secuencial" : "Por rondas"}
                </span>
                <span className="mt-1 block text-xs text-current opacity-75">
                  {kind === "sequential"
                    ? "Ejercicio por ejercicio"
                    : "Alternar en cada vuelta"}
                </span>
              </button>
            ))}
          </div>
          <SortableContext
            items={section.exercises.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="py-1">
              {children}
              <div className="m-3">{addExercise}</div>
            </div>
          </SortableContext>
        </>
      )}
    </div>
  );
}
