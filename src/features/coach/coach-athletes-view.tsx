"use client";

import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Routine, User } from "@/lib/rttp-data";

import { cantidadEjercicios } from "@/domain/routine/routine-metrics";
import { DialogoNuevoAtleta } from "@/features/routine-editor/new-athlete-dialog";
import {
  pageDescriptionClassName,
  pageEyebrowClassName,
  pageTitleClassName,
} from "@/features/shared/page-shell";

export function CoachAthletesView({
  users,
  atletas,
  rutinasPorAtleta,
  onCreateAtleta,
  onSelectAtleta,
  navigate,
}: {
  users: User[];
  atletas: User[];
  rutinasPorAtleta: Routine[];
  onCreateAtleta: (name: string, email: string) => Promise<string | null>;
  onSelectAtleta: (id: number) => void;
  navigate: (path: string) => void;
}) {
  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className={pageEyebrowClassName}>Tus atletas</div>
          <h1 className={pageTitleClassName}>Seguimiento individual</h1>
          <p className={pageDescriptionClassName}>
            Revisá la carga, detectá rutinas incompletas y entrá rápido a la
            planificación de cada atleta.
          </p>
        </div>
        <DialogoNuevoAtleta users={users} onCreate={onCreateAtleta} />
      </div>
      <div className="rounded-3xl border border-white/[0.07] bg-app-surface/70 p-4 md:p-5 xl:p-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
          {atletas.map((item) => {
            const planes = rutinasPorAtleta.filter(
              (rutinaActual) => rutinaActual.athleteId === item.id,
            );
            const exercises = planes.reduce(
              (total, rutinaActual) =>
                total + cantidadEjercicios(rutinaActual),
              0,
            );
            const rutinasIncompletas = planes.filter(
              (rutinaActual) => cantidadEjercicios(rutinaActual) === 0,
            ).length;

            return (
              <div
                key={item.id}
                className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {item.name}
                      </div>
                      <div className="truncate text-[10px] text-white/30">
                        {item.email}
                      </div>
                    </div>
                    {rutinasIncompletas > 0 && (
                      <Badge className="shrink-0 border-amber-300/15 bg-amber-300/10 text-[9px] text-amber-100/80">
                        {rutinasIncompletas} sin completar
                      </Badge>
                    )}
                  </div>
                  {rutinasIncompletas > 0 && (
                    <div className="mt-3 rounded-xl border border-amber-300/10 bg-amber-300/[0.05] px-3 py-2 text-[10px] text-amber-100/70">
                      Revisá las rutinas vacías antes de asignar nuevas
                      cargas.
                    </div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/[0.035] px-3 py-2">
                    <div className="text-sm">{planes.length}</div>
                    <div className="text-[9px] uppercase tracking-wider text-white/30">
                      Planes
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/[0.035] px-3 py-2">
                    <div className="text-sm">{exercises}</div>
                    <div className="text-[9px] uppercase tracking-wider text-white/30">
                      Ejercicios
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectAtleta(item.id);
                    navigate(`/coach/athletes/${item.id}`);
                  }}
                  className="mt-4 flex h-9 items-center justify-center gap-2 rounded-full bg-cyan-300 text-xs font-medium text-indigo-950 transition-colors hover:bg-cyan-200"
                >
                  Ver planificación
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
