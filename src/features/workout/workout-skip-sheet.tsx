"use client";

import { Clock3, Dumbbell, LayoutGrid, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Routine } from "@/lib/rttp-data";

import { RoutineStep } from "@/domain/routine/routine-steps";
import { TrainingSetRecord } from "@/domain/workout/workout-session";
import { SkipScope } from "@/features/workout/workout-round-summary";

export function WorkoutSkipSheet({
  rutina,
  paso,
  registro,
  posponerEjercicio,
  omitir,
}: {
  rutina: Routine;
  paso: RoutineStep;
  registro: TrainingSetRecord;
  posponerEjercicio: () => void;
  omitir: (alcance: SkipScope) => void;
}) {
  return (
  <Sheet>
    <SheetTrigger
      render={
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-white/10 bg-white/[0.035] text-white/45 hover:bg-white/[0.08] hover:text-white"
          aria-label="Opciones para saltar"
        />
      }
    >
      <SkipForward />
    </SheetTrigger>
    <SheetContent
      side="bottom"
      className="mx-auto max-w-lg rounded-t-[2rem] border-white/10 bg-app-panel pb-6 text-white"
    >
      <SheetHeader className="px-5 pt-6">
        <SheetTitle className="text-white">
          ¿Qué querés saltar?
        </SheetTitle>
        <SheetDescription className="text-white/60">
          Podés dejarlo para más tarde o registrar una
          omisión definitiva.
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-2 px-4">
        {!registro.deferred &&
          !registro.completed &&
          !registro.skipped && (
            <SheetClose
              render={
                <button
                  onClick={posponerEjercicio}
                  className="flex w-full items-center gap-3 rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.07] p-4 text-left transition-colors hover:bg-cyan-300/[0.12]"
                />
              }
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-cyan-300/10 text-cyan-200">
                <Clock3 className="size-4" />
              </div>
              <div>
                <div className="text-sm text-white">
                  Volver más tarde
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-white/60">
                  Deja sus series pendientes para el final
                  de la rutina, sin marcarlas como omitidas.
                </div>
              </div>
            </SheetClose>
          )}
        {[
          {
            alcance: "serie" as const,
            icono: SkipForward,
            title: "Saltar esta serie",
            texto: `Omitir solo la serie ${paso.round} de ${paso.name}.`,
          },
          {
            alcance: "ejercicio" as const,
            icono: Dumbbell,
            title: "Saltar ejercicio",
            texto:
              "Útil si la máquina está ocupada. Omite sus series restantes.",
          },
          {
            alcance: "seccion" as const,
            icono: LayoutGrid,
            title: "Saltar sección",
            texto:
              paso.sectionIndex ===
              rutina.structure.sections.length - 1
                ? "Omitir lo restante y finalizar la rutina."
                : `Pasar directamente a la sección ${paso.sectionIndex + 2}.`,
          },
        ].map((opcion) => (
          <SheetClose
            key={opcion.alcance}
            render={
              <button
                onClick={() => omitir(opcion.alcance)}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition-colors hover:bg-white/[0.06]"
              />
            }
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-violet-300/10 text-violet-200">
              <opcion.icono className="size-4" />
            </div>
            <div>
              <div className="text-sm text-white">
                {opcion.title}
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-white/60">
                {opcion.texto}
              </div>
            </div>
          </SheetClose>
        ))}
      </div>
    </SheetContent>
  </Sheet>
  );
}
