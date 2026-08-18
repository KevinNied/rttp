"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Dumbbell,
  Flame,
  ListChecks,
  Trash2,
} from "lucide-react";

import { CompletedActivity } from "@/lib/rttp-activity";
import { activityCategories } from "@/lib/rttp-agenda";
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

function categoriaActividad(category: CompletedActivity["category"]) {
  return activityCategories.find((item) => item.value === category)?.label ?? null;
}

function agruparBloques(actividad: CompletedActivity) {
  return actividad.sets.reduce<
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
}

function resumenActividad(actividad: CompletedActivity) {
  const seriesCompletadas = actividad.sets.filter((serie) => !serie.skipped).length;
  const bloques = agruparBloques(actividad);

  return {
    bloques,
    seriesCompletadas,
    resumen:
      actividad.type === "routine"
        ? [
            `${seriesCompletadas} series`,
            `${bloques.length} ${bloques.length === 1 ? "bloque" : "bloques"}`,
          ]
        : [categoriaActividad(actividad.category) ?? "Actividad externa"],
  };
}

function ActivityChip({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/45">
      <span className="text-white/35">{icon}</span>
      {label}
    </span>
  );
}

function ActivityCopy({
  title,
  body,
  tone = "default",
}: {
  title: string;
  body: string;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3.5",
        tone === "accent"
          ? "border-cyan-200/10 bg-cyan-300/[0.04]"
          : "border-white/[0.07] bg-white/[0.025]",
      )}
    >
      <div
        className={cn(
          "text-[9px] uppercase tracking-wider",
          tone === "accent" ? "text-cyan-100/35" : "text-white/25",
        )}
      >
        {title}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/58">{body}</p>
    </div>
  );
}

function DetalleRutina({ actividad }: { actividad: CompletedActivity }) {
  const { bloques, seriesCompletadas } = resumenActividad(actividad);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {actividad.durationMinutes && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="text-lg font-light">{actividad.durationMinutes}</div>
            <div className="text-[9px] uppercase tracking-wider text-white/25">
              Minutos
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
          <div className="text-lg font-light">{seriesCompletadas}</div>
          <div className="text-[9px] uppercase tracking-wider text-white/25">
            Series
          </div>
        </div>
        {actividad.effort && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="text-lg font-light">{actividad.effort}/5</div>
            <div className="text-[9px] uppercase tracking-wider text-white/25">
              Esfuerzo
            </div>
          </div>
        )}
      </div>

      {actividad.notes && <ActivityCopy title="Notas" body={actividad.notes} />}
      {actividad.feedback && (
        <ActivityCopy
          title="Feedback del atleta"
          body={actividad.feedback}
          tone="accent"
        />
      )}

      {bloques.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-white/60">Detalle de la sesión</div>
          {bloques.map((bloque, index) => (
            <div
              key={bloque.id}
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <div className="text-[11px] font-medium text-white/70">{bloque.name}</div>
                <div className="text-[9px] uppercase tracking-wider text-white/25">
                  {bloque.sets.length} {bloque.sets.length === 1 ? "serie" : "series"}
                </div>
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
                        Bloque {index + 1} · Serie {serie.round}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "shrink-0 text-right text-[10px]",
                        serie.skipped ? "text-orange-200/45" : "text-cyan-100/55",
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
      )}
    </div>
  );
}

function DetalleExterno({ actividad }: { actividad: CompletedActivity }) {
  const tieneDetalle = Boolean(actividad.notes || actividad.feedback);

  return (
    <div className="space-y-3">
      {actividad.notes && <ActivityCopy title="Notas" body={actividad.notes} />}
      {actividad.feedback && (
        <ActivityCopy
          title="Feedback del atleta"
          body={actividad.feedback}
          tone="accent"
        />
      )}
      {!tieneDetalle && (
        <div className="text-xs text-white/35">Sin detalles adicionales para esta actividad.</div>
      )}
    </div>
  );
}

export function ActivityHistory({
  activities,
  embedded = false,
  onDeleteActivity,
  canDeleteExternalActivities = false,
}: {
  activities: CompletedActivity[];
  embedded?: boolean;
  onDeleteActivity?: (activity: CompletedActivity) => void;
  canDeleteExternalActivities?: boolean;
}) {
  const [filtro, setFiltro] = useState<FiltroActividad>("todas");
  const [expandidaId, setExpandidaId] = useState("");
  const ordenadas = useMemo(
    () =>
      [...activities].sort((a, b) =>
        `${b.date}${b.completedAt}`.localeCompare(`${a.date}${a.completedAt}`),
      ),
    [activities],
  );
  const visibles = ordenadas.filter((actividad) => {
    if (filtro === "routines") return actividad.type === "routine";
    if (filtro === "externas") return actividad.type === "external";
    return true;
  });
  const minutos = activities.reduce(
    (total, actividad) => total + (actividad.durationMinutes ?? 0),
    0,
  );

  return (
    <div
      className={cn(
        embedded
          ? ""
          : "mx-auto max-w-[1760px] px-4 py-7 md:px-8 md:py-10 xl:px-10 xl:py-12",
      )}
    >
      {!embedded && (
        <div className="mb-6">
          <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200/60">
            Tu recorrido
          </div>
          <h1 className="text-3xl font-light tracking-[-0.035em] md:text-4xl">
            Actividades realizadas
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/35 md:text-sm">
            Abrí solo la actividad que quieras revisar para mantener el historial más ágil.
          </p>
        </div>
      )}

      {activities.length === 0 ? (
        <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-white/[0.09] bg-white/[0.02] px-6 text-center">
          <div>
            <Activity className="mx-auto size-6 text-white/20" />
            <h2 className="mt-3 text-sm font-medium">Todavía no hay actividades</h2>
            <p className="mt-2 text-xs text-white/30">
              Cuando completes una rutina o actividad aparecerá acá.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {[
              [activities.length, "Actividades"],
              ...(activities.some((actividad) => actividad.durationMinutes)
                ? [[minutos, "Minutos"]]
                : []),
              [
                activities.filter((actividad) => actividad.type === "routine").length,
                "Rutinas RTTP",
              ],
            ].map(([valor, label], index) => (
              <div
                key={label as string}
                className={cn(
                  "rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5",
                  index === 2 && "col-span-2 sm:col-span-1",
                )}
              >
                <div className="text-xl font-light md:text-2xl">{valor as number}</div>
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
            <div className="space-y-3">
              {visibles.map((actividad) => {
                const expandida = expandidaId === actividad.id;
                const categoria = categoriaActividad(actividad.category);
                const { resumen, seriesCompletadas } = resumenActividad(actividad);

                return (
                  <div
                    key={actividad.id}
                    className={cn(
                      "overflow-hidden rounded-3xl border transition-colors",
                      expandida
                        ? "border-cyan-200/20 bg-cyan-300/[0.05]"
                        : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.04]",
                    )}
                  >
                    <button
                      onClick={() =>
                        setExpandidaId((actual) =>
                          actual === actividad.id ? "" : actividad.id,
                        )
                      }
                      className="w-full px-3.5 py-3.5 text-left md:px-4"
                      aria-expanded={expandida}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl",
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

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-white/80">
                                {actividad.title}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/30">
                                <span className="inline-flex items-center gap-1.5 capitalize">
                                  <CalendarDays className="size-3" />
                                  {fechaActividad(actividad.date)}
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-white/25">
                                  <CheckCircle2 className="size-3" />
                                  {actividad.type === "routine"
                                    ? "Rutina completada"
                                    : "Actividad externa"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pl-2">
                              <span className="hidden text-[10px] text-white/25 sm:inline">
                                {expandida ? "Ocultar" : "Ver detalle"}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "size-4 shrink-0 text-white/35 transition-transform",
                                  expandida && "rotate-180",
                                )}
                              />
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {actividad.durationMinutes && (
                              <ActivityChip
                                icon={<Clock3 className="size-3" />}
                                label={`${actividad.durationMinutes} min`}
                              />
                            )}
                            {actividad.effort && (
                              <ActivityChip
                                icon={<Flame className="size-3" />}
                                label={`Esfuerzo ${actividad.effort}/5`}
                              />
                            )}
                            {actividad.type === "routine" ? (
                              <>
                                <ActivityChip
                                  icon={<ListChecks className="size-3" />}
                                  label={`${seriesCompletadas} series`}
                                />
                                {resumen[1] && (
                                  <ActivityChip
                                    icon={<Dumbbell className="size-3" />}
                                    label={resumen[1]}
                                  />
                                )}
                              </>
                            ) : categoria ? (
                              <ActivityChip
                                icon={<Activity className="size-3" />}
                                label={categoria}
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>

                    {expandida && (
                      <div className="border-t border-white/[0.07] px-3.5 pb-3.5 pt-0 md:px-4 md:pb-4">
                        {actividad.type === "routine" ? (
                          <DetalleRutina actividad={actividad} />
                        ) : (
                          <DetalleExterno actividad={actividad} />
                        )}
                        {actividad.type === "external" &&
                          canDeleteExternalActivities &&
                          onDeleteActivity && (
                          <div className="mt-4 flex justify-end border-t border-white/[0.06] pt-4">
                            <button
                              type="button"
                              onClick={() => onDeleteActivity(actividad)}
                              className="inline-flex h-9 items-center gap-2 rounded-full border border-red-300/15 bg-red-300/10 px-3.5 text-[11px] font-medium text-red-100/85 transition-colors hover:bg-red-300/15 hover:text-red-50"
                            >
                              <Trash2 className="size-3.5" />
                              Eliminar actividad
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
