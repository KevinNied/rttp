"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  ListChecks,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { CompletedActivity } from "@/lib/rttp-activity";
import { activityCategories } from "@/lib/rttp-agenda";
import { User } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

type FiltroActividad = "todas" | "routines" | "externas";

function fechaActividad(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function DetalleActividad({
  actividad,
}: {
  actividad: CompletedActivity;
}) {
  const seriesCompletadas = actividad.sets.filter(
    (serie) => !serie.skipped,
  ).length;
  const blocks = actividad.sets.reduce<
    {
      id: string;
      name: string;
      sets: CompletedActivity["sets"];
    }[]
  >((actuales, serie) => {
    const existente = actuales.find((bloque) => bloque.id === serie.blockId);
    if (existente) {
      existente.sets.push(serie);
      return actuales;
    }
    return [
      ...actuales,
      {
        id: serie.blockId,
        name: serie.blockName,
        sets: [serie],
      },
    ];
  }, []);

  return (
    <Card
      id="detalle-actividad"
      className="border-white/[0.08] bg-[#101116] text-white shadow-[0_24px_70px_rgba(0,0,0,.3)]"
    >
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] capitalize text-cyan-100/50">
              {fechaActividad(actividad.date)}
            </div>
            <h2 className="mt-2 text-2xl font-light tracking-[-0.03em]">
              {actividad.title}
            </h2>
            {actividad.category && (
              <div className="mt-2 text-[9px] uppercase tracking-[0.14em] text-violet-200/40">
                {
                  activityCategories.find(
                    (category) => category.value === actividad.category,
                  )?.label
                }
              </div>
            )}
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300">
            <CheckCircle2 className="size-4" />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <Clock3 className="size-3.5 text-cyan-200/65" />
            <div className="mt-2 text-lg font-light">
              {actividad.durationMinutes}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-white/25">
              Minutos
            </div>
          </div>
          {actividad.type === "routine" && (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
              <ListChecks className="size-3.5 text-violet-200/65" />
              <div className="mt-2 text-lg font-light">{seriesCompletadas}</div>
              <div className="text-[9px] uppercase tracking-wider text-white/25">
                Series
              </div>
            </div>
          )}
          {actividad.effort && (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
              <Flame className="size-3.5 text-orange-200/65" />
              <div className="mt-2 text-lg font-light">
                {actividad.effort}/5
              </div>
              <div className="text-[9px] uppercase tracking-wider text-white/25">
                Esfuerzo
              </div>
            </div>
          )}
        </div>

        {actividad.notes && (
          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="text-[9px] uppercase tracking-wider text-white/25">
              Notas
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/55">
              {actividad.notes}
            </p>
          </div>
        )}

        {actividad.feedback && (
          <div className="mt-3 rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.04] p-4">
            <div className="text-[9px] uppercase tracking-wider text-cyan-100/35">
              Feedback del atleta
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              {actividad.feedback}
            </p>
          </div>
        )}

        {blocks.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 text-xs font-medium text-white/65">
              Detalle de la sesión
            </div>
            <div className="space-y-3">
              {blocks.map((bloque) => (
                <div
                  key={bloque.id}
                  className="overflow-hidden rounded-2xl border border-white/[0.07]"
                >
                  <div className="border-b border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-[10px] font-medium text-white/55">
                    {bloque.name}
                  </div>
                  <div className="divide-y divide-white/[0.05]">
                    {bloque.sets.map((serie) => (
                      <div
                        key={serie.stepId}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[11px] text-white/70">
                            {serie.exerciseName}
                          </div>
                          <div className="mt-0.5 text-[9px] text-white/25">
                            Serie {serie.round}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "shrink-0 text-right text-[10px]",
                            serie.skipped
                              ? "text-orange-200/45"
                              : "text-cyan-100/55",
                          )}
                        >
                          {serie.skipped
                            ? "Omitida"
                            : `${serie.reps} reps${
                                serie.weight > 0 ? ` · ${serie.weight} kg` : ""
                              }`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ActivityHistory({
  atleta,
  activities,
  embedded = false,
}: {
  atleta: User;
  activities: CompletedActivity[];
  embedded?: boolean;
}) {
  const [filtro, setFiltro] = useState<FiltroActividad>("todas");
  const ordenadas = useMemo(
    () =>
      [...activities].sort((a, b) =>
        `${b.date}${b.completedAt}`.localeCompare(
          `${a.date}${a.completedAt}`,
        ),
      ),
    [activities],
  );
  const visibles = ordenadas.filter((actividad) => {
    if (filtro === "routines") return actividad.type === "routine";
    if (filtro === "externas") return actividad.type === "external";
    return true;
  });
  const [seleccionadaId, setSeleccionadaId] = useState(
    ordenadas[0]?.id ?? "",
  );
  const seleccionada =
    visibles.find((actividad) => actividad.id === seleccionadaId) ??
    visibles[0];
  const minutos = activities.reduce(
    (total, actividad) => total + actividad.durationMinutes,
    0,
  );

  function seleccionar(id: string) {
    setSeleccionadaId(id);
    if (window.innerWidth < 1024) {
      window.requestAnimationFrame(() =>
        document
          .getElementById("detalle-actividad")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }

  return (
    <div
      className={cn(
        embedded
          ? ""
          : "mx-auto max-w-[1400px] px-4 py-7 md:px-8 md:py-10 xl:px-10 xl:py-12",
      )}
    >
      <div className="mb-6">
        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200/60">
          {embedded ? `Actividad de ${atleta.name}` : "Tu recorrido"}
        </div>
        <h1 className="text-3xl font-light tracking-[-0.035em] md:text-4xl">
          Actividades realizadas
        </h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/35 md:text-sm">
          Revisá sesiones de RTTP y entrenamientos realizados fuera de la app.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-white/[0.09] bg-white/[0.02] px-6 text-center">
          <div>
            <Activity className="mx-auto size-6 text-white/20" />
            <h2 className="mt-3 text-sm font-medium">
              Todavía no hay actividades
            </h2>
            <p className="mt-2 text-xs text-white/30">
              Cuando completes una rutina o actividad aparecerá acá.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              [activities.length, "Actividades"],
              [minutos, "Minutos"],
              [
                activities.filter((actividad) => actividad.type === "routine")
                  .length,
                "Rutinas RTTP",
              ],
            ].map(([valor, label], index) => (
              <div
                key={label as string}
                className={cn(
                  "rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4",
                  index === 2 && "col-span-2 sm:col-span-1",
                )}
              >
                <div className="text-2xl font-light">{valor as number}</div>
                <div className="mt-1 text-[9px] uppercase tracking-wider text-white/30">
                  {label as string}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4 flex gap-1 rounded-2xl bg-white/[0.025] p-1 sm:w-fit">
            {[
              ["todas", "Todas"],
              ["routines", "Rutinas"],
              ["externas", "Externas"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFiltro(value as FiltroActividad)}
                className={cn(
                  "flex-1 rounded-xl px-4 py-2 text-[10px] transition-colors sm:flex-none",
                  filtro === value
                    ? "bg-white/[0.08] text-white"
                    : "text-white/30 hover:text-white/60",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] py-12 text-center text-xs text-white/30">
              No hay actividades en esta categoría.
            </div>
          ) : (
            <div className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
              <div className="space-y-2">
                {visibles.map((actividad) => (
                  <button
                    key={actividad.id}
                    onClick={() => seleccionar(actividad.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors",
                      seleccionada?.id === actividad.id
                        ? "border-cyan-200/20 bg-cyan-300/[0.07]"
                        : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl",
                        actividad.type === "routine"
                          ? "bg-cyan-300/10 text-cyan-200"
                          : "bg-violet-300/10 text-violet-200",
                      )}
                    >
                      {actividad.type === "routine" ? (
                        <Dumbbell className="size-4" />
                      ) : (
                        <Activity className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-white/75">
                        {actividad.title}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-[9px] capitalize text-white/25">
                        <CalendarDays className="size-3" />
                        {fechaActividad(actividad.date)}
                      </span>
                    </span>
                    <span className="text-[9px] text-white/25">
                      {actividad.durationMinutes} min
                    </span>
                  </button>
                ))}
              </div>
              <div className="scroll-mt-24 lg:sticky lg:top-24">
                {seleccionada && (
                  <DetalleActividad actividad={seleccionada} />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
