"use client";

import { ArrowRight } from "lucide-react";

import { Routine, User } from "@/lib/rttp-data";

import { cantidadEjercicios } from "@/domain/routine/routine-metrics";
import { RoutineTemplate } from "@/domain/routine/routine-factory";
import {
  pageDescriptionClassName,
  pageEyebrowClassName,
  pageTitleClassName,
} from "@/features/shared/page-shell";

export function CoachOverviewView({
  atletas,
  templates,
  rutinasPorAtleta,
  navigate,
}: {
  atletas: User[];
  templates: RoutineTemplate[];
  rutinasPorAtleta: Routine[];
  navigate: (path: string) => void;
}) {
  const rutinasSinEjercicios = rutinasPorAtleta.filter(
    (item) => cantidadEjercicios(item) === 0,
  );
  const atletasConRutinasIncompletas = atletas.filter((atletaActual) =>
    rutinasPorAtleta.some(
      (rutinaActual) =>
        rutinaActual.athleteId === atletaActual.id &&
        cantidadEjercicios(rutinaActual) === 0,
    ),
  );

  return (
    <section>
      <div className="mb-8">
        <div className={pageEyebrowClassName}>
          Workspace de entrenamiento
        </div>
        <h1 className={pageTitleClassName}>
          Planificá el progreso de tus atletas
        </h1>
        <p className={pageDescriptionClassName}>
          Organizá atletas, reutilizá plantillas y personalizá cada plan
          desde sus espacios dedicados.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [atletas.length, "Atletas", "Gestioná sus perfiles"],
          [templates.length, "Plantillas propias", "Reutilizables"],
          [
            rutinasPorAtleta.length,
            "Planes asignados",
            "En todos tus atletas",
          ],
          [
            rutinasSinEjercicios.length,
            "Rutinas a revisar",
            rutinasSinEjercicios.length === 0
              ? "Todo el contenido está cargado"
              : "Todavía les faltan ejercicios",
          ],
        ].map(([cantidad, title, detalle]) => (
          <div
            key={title as string}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-4"
          >
            <div className="text-2xl font-light">{cantidad as number}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-white/45">
              {title as string}
            </div>
            <div className="mt-1 text-[10px] text-white/25">
              {detalle as string}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <button
          type="button"
          onClick={() => navigate("/coach/athletes")}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left transition-colors hover:bg-white/[0.04]"
        >
          <div className="text-sm font-medium">Seguí con tus atletas</div>
          <p className="mt-1 text-xs leading-relaxed text-white/35">
            Entrá directo a la planificación individual y revisá cargas,
            agenda y actividades.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-cyan-100">
            Abrir atletas
            <ArrowRight className="size-3.5" />
          </div>
        </button>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="text-sm font-medium">Rutinas para completar</div>
          <p className="mt-1 text-xs leading-relaxed text-white/35">
            {atletasConRutinasIncompletas.length === 0
              ? "No hay atletas con rutinas vacías. Todo el contenido base ya está cargado."
              : `${atletasConRutinasIncompletas.length} atleta${atletasConRutinasIncompletas.length === 1 ? "" : "s"} tiene${atletasConRutinasIncompletas.length === 1 ? "" : "n"} al menos una rutina sin ejercicios.`}
          </p>
          <button
            type="button"
            onClick={() => navigate("/coach/routines")}
            className="mt-4 inline-flex items-center gap-2 text-xs text-cyan-100"
          >
            Ir a plantillas y rutinas
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
