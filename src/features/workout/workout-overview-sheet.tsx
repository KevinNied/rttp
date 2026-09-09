"use client";

import { Check, Dumbbell, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { countLabel } from "@/lib/format";
import { Routine } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

import { RoutineStep } from "@/domain/routine/routine-steps";
import { TrainingSetRecords } from "@/domain/workout/workout-session";

export function WorkoutOverviewSheet({
  rutina,
  pasos,
  paso,
  registros,
  registrosResueltos,
  registrosPospuestos,
}: {
  rutina: Routine;
  pasos: RoutineStep[];
  paso: RoutineStep;
  registros: TrainingSetRecords;
  registrosResueltos: number;
  registrosPospuestos: number;
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ver resumen de la rutina"
            className="size-9 rounded-full border border-indigo-200/10 text-indigo-100/55 hover:bg-indigo-300/10 hover:text-white"
          />
        }
      >
        <ListChecks />
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[85dvh] max-w-2xl overflow-y-auto rounded-t-[2rem] border-white/10 bg-app-panel pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white"
      >
        <SheetHeader className="px-5 pt-6 text-left">
          <SheetTitle className="text-white">Vista general</SheetTitle>
          <SheetDescription className="text-white/60">
            {registrosResueltos} de {pasos.length} series resueltas
            {registrosPospuestos > 0
              ? ` · ${countLabel(registrosPospuestos, "serie")} para después`
              : ""}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4">
          {rutina.structure.sections.map((itemBlock, blockIndex) => (
            <div
              key={itemBlock.id}
              className={cn(
                "rounded-2xl border p-4",
                itemBlock.id === paso.sectionId
                  ? "border-cyan-200/20 bg-cyan-300/[0.06]"
                  : "border-white/[0.07] bg-white/[0.025]",
              )}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-cyan-100/65">
                Sección {blockIndex + 1} de{" "}
                {rutina.structure.sections.length}
              </div>
              <div className="mt-1 text-sm font-medium text-white">
                {itemBlock.name}
              </div>
              <div className="mt-3 space-y-2">
                {itemBlock.exercises.map((exercise) => {
                  const exerciseSteps = pasos.filter(
                    (item) => item.id === exercise.id,
                  );
                  const completed = exerciseSteps.filter(
                    (item) => registros[item.stepId]?.completed,
                  ).length;
                  const skipped = exerciseSteps.filter(
                    (item) => registros[item.stepId]?.skipped,
                  ).length;
                  const deferred = exerciseSteps.filter(
                    (item) =>
                      registros[item.stepId]?.deferred &&
                      !registros[item.stepId]?.completed,
                  ).length;
                  const current = exercise.id === paso.id;

                  return (
                    <div
                      key={exercise.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5",
                        current ? "bg-white/[0.08]" : "bg-black/15",
                      )}
                    >
                      <div
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-full border",
                          completed === exerciseSteps.length
                            ? "border-cyan-200/20 bg-cyan-300 text-indigo-950"
                            : "border-white/10 text-white/45",
                        )}
                      >
                        {completed === exerciseSteps.length ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Dumbbell className="size-3" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-white/85">
                          {exercise.name}
                        </div>
                        <div className="mt-0.5 text-[10px] text-white/50">
                          {completed}/{exerciseSteps.length} series
                          {skipped > 0 ? ` · ${skipped} omitidas` : ""}
                          {deferred > 0 ? " · para después" : ""}
                        </div>
                      </div>
                      {current && (
                        <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-cyan-200">
                          Ahora
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
