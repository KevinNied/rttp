"use client";

import { Check, Clock3, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { countLabel } from "@/lib/format";
import { RoutineSection } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

import { repeticionesObjetivo } from "@/domain/routine/routine-metrics";
import { RoutineStep } from "@/domain/routine/routine-steps";
import { TrainingSetRecords } from "@/domain/workout/workout-session";
import { TextWithLinks } from "@/features/shared/text-with-links";

export type SkipScope = "serie" | "ejercicio" | "seccion";

export function WorkoutRoundSummary({
  section,
  paso,
  pasos,
  registros,
  completarRondaResumida,
  omitir,
}: {
  section: RoutineSection;
  paso: RoutineStep;
  pasos: RoutineStep[];
  registros: TrainingSetRecords;
  completarRondaResumida: () => void;
  omitir: (alcance: SkipScope) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-cyan-200/[0.14] bg-app-panel p-5 shadow-[0_30px_80px_rgba(0,0,0,.5)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_0%,rgba(34,211,238,.14),transparent_37%),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.15),transparent_42%)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-cyan-100/70">
              Vista rápida
            </div>
            <h1 className="mt-2 text-2xl font-normal tracking-[-0.035em]">
              Toda la vuelta, de un vistazo
            </h1>
            <p className="mt-1 text-[11px] font-medium text-white/60">
              {countLabel(section.exercises.length, "ejercicio")} · vuelta{" "}
              {paso.round} de {paso.rondas}
            </p>
          </div>
          <div className="grid size-10 shrink-0 place-items-center rounded-full border border-cyan-200/15 bg-cyan-300/10 text-cyan-200">
            <ListChecks className="size-4" />
          </div>
        </div>

        <div className="mt-5 divide-y divide-white/[0.07] rounded-2xl border border-white/[0.07] bg-black/20 px-4">
          {section.exercises.map((item, index) => {
            const pasoDeRonda = pasos.find(
              (candidato) =>
                candidato.sectionId === paso.sectionId &&
                candidato.round === paso.round &&
                candidato.id === item.id,
            );
            const completado = pasoDeRonda
              ? registros[pasoDeRonda.stepId]?.completed
              : false;
            const pospuesto = pasoDeRonda
              ? registros[pasoDeRonda.stepId]?.deferred
              : false;

            return (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <div
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border text-[9px]",
                    completado
                      ? "border-cyan-200/20 bg-cyan-300 text-indigo-950"
                      : pospuesto
                        ? "border-orange-200/20 bg-orange-300/10 text-orange-200"
                        : "border-white/10 bg-white/[0.035] text-white/40",
                  )}
                >
                  {completado ? (
                    <Check className="size-3" />
                  ) : pospuesto ? (
                    <Clock3 className="size-3" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-white/85">
                    {item.name}
                  </div>
                  {item.instructions && (
                    <div className="mt-0.5 truncate text-[11px] text-violet-100/65">
                      <TextWithLinks>{item.instructions}</TextWithLinks>
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-[11px] font-medium tabular-nums text-white/60">
                  {pospuesto && !completado
                    ? "Para después"
                    : `${repeticionesObjetivo(item)} reps`}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          onClick={completarRondaResumida}
          className="mt-5 h-12 w-full rounded-full bg-indigo-50 text-indigo-950 hover:bg-cyan-100"
        >
          <Check />
          {paso.round === paso.rondas
            ? "Completar calentamiento"
            : `Completar vuelta ${paso.round}`}
        </Button>
        <button
          onClick={() => omitir("seccion")}
          className="mt-3 w-full text-center text-[11px] font-medium text-white/55 transition-colors hover:text-white/80"
        >
          Saltar esta sección
        </button>
      </div>
    </div>
  );
}
