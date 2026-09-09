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
import { countLabel, formatDuration } from "@/lib/format";
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
  return (
    activityCategories.find((item) => item.value === category)?.label ?? null
  );
}

function groupSections(actividad: CompletedActivity) {
  const fallbackGroups = actividad.sets.reduce<
    {
      id: string;
      name: string;
      sets: CompletedActivity["sets"];
    }[]
  >((actuales, serie) => {
    const existente = actuales.find(
      (section) => section.id === serie.sectionId,
    );
    if (existente) {
      existente.sets.push(serie);
      return actuales;
    }
    return [
      ...actuales,
      {
        id: serie.sectionId,
        name: serie.sectionName,
        sets: [serie],
      },
    ];
  }, []);

  const snapshotSections =
    actividad.routineSnapshot?.structure.sections ?? [];
  if (snapshotSections.length === 0) return fallbackGroups;

  const knownSectionIds = new Set(
    snapshotSections.map((section) => section.id),
  );
  const snapshotGroups = snapshotSections.flatMap((section) => {
    const exerciseOrder = new Map(
      section.exercises.map((exercise, index) => [exercise.id, index]),
    );
    const sets = actividad.sets
      .filter((set) => set.sectionId === section.id)
      .sort((first, second) => {
        const exerciseDifference =
          (exerciseOrder.get(first.exerciseId) ?? Number.MAX_SAFE_INTEGER) -
          (exerciseOrder.get(second.exerciseId) ?? Number.MAX_SAFE_INTEGER);
        return section.kind === "sequential"
          ? exerciseDifference || first.iteration - second.iteration
          : first.iteration - second.iteration || exerciseDifference;
      });

    return sets.length > 0
      ? [{ id: section.id, name: section.name, sets }]
      : [];
  });

  return [
    ...snapshotGroups,
    ...fallbackGroups.filter((section) => !knownSectionIds.has(section.id)),
  ];
}

function resumenActividad(actividad: CompletedActivity) {
  const seriesCompletadas = actividad.sets.filter(
    (serie) => !serie.skipped,
  ).length;
  const sections = groupSections(actividad);

  return {
    sections,
    seriesCompletadas,
    resumen:
      actividad.type === "routine"
        ? [
            countLabel(seriesCompletadas, "serie", "series"),
            countLabel(sections.length, "sección", "secciones"),
          ]
        : [categoriaActividad(actividad.category) ?? "Actividad externa"],
  };
}

function groupExerciseSets(sets: CompletedActivity["sets"]) {
  return sets.reduce<
    {
      id: string;
      name: string;
      sets: CompletedActivity["sets"];
    }[]
  >((groups, set) => {
    const existingGroup = groups.find((group) => group.id === set.exerciseId);
    if (existingGroup) {
      existingGroup.sets.push(set);
      return groups;
    }
    return [
      ...groups,
      {
        id: set.exerciseId,
        name: set.exerciseName,
        sets: [set],
      },
    ];
  }, []);
}

function setResult(set: CompletedActivity["sets"][number]) {
  if (set.skipped) return "Omitida";
  return `${set.reps} reps${set.weight > 0 ? ` · ${set.weight} kg` : ""}`;
}

function ActivityChip({ icon, label }: { icon: ReactNode; label: string }) {
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
  const { sections, seriesCompletadas } = resumenActividad(actividad);
  const [openSectionId, setOpenSectionId] = useState(sections[0]?.id ?? "");
  const duracion =
    actividad.durationSeconds ??
    (actividad.durationMinutes ? actividad.durationMinutes * 60 : null);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {duracion !== null && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="text-lg font-light tabular-nums">
              {formatDuration(duracion)}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-white/25">
              {actividad.type === "routine" ? "Tiempo real" : "Duración"}
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

      {sections.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-4 px-1">
            <div>
              <div className="text-sm font-medium text-white/75">
                Detalle de la sesión
              </div>
              <div className="mt-1 text-xs text-white/35">
                Abrí una sección para revisar sus ejercicios y cargas.
              </div>
            </div>
          </div>
          {sections.map((section) => {
            const exerciseGroups = groupExerciseSets(section.sets);
            const isOpen = openSectionId === section.id;

            return (
              <div
                key={section.id}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenSectionId((current) =>
                      current === section.id ? "" : section.id,
                    )
                  }
                  className="flex w-full items-center justify-between gap-4 bg-white/[0.03] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white/80">
                      {section.name}
                    </div>
                    <div className="mt-1 text-xs text-white/35">
                      {countLabel(
                        exerciseGroups.length,
                        "ejercicio",
                        "ejercicios",
                      )}{" "}
                      · {countLabel(section.sets.length, "serie", "series")}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-white/35 transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
                    {exerciseGroups.map((exercise) => {
                      const completedSets = exercise.sets.filter(
                        (set) => !set.skipped,
                      );
                      const uniqueResults = new Set(
                        completedSets.map((set) => setResult(set)),
                      );
                      const hasUniformResult =
                        completedSets.length === exercise.sets.length &&
                        uniqueResults.size === 1;

                      return (
                        <div
                          key={exercise.id}
                          className="grid gap-2 px-4 py-3.5 md:grid-cols-[minmax(12rem,0.75fr)_minmax(0,1.25fr)] md:items-center md:gap-6"
                        >
                          <div className="min-w-0">
                            <div className="text-sm text-white/75">
                              {exercise.name}
                            </div>
                            <div className="mt-1 text-xs text-white/30">
                              {countLabel(
                                exercise.sets.length,
                                "serie",
                                "series",
                              )}
                            </div>
                          </div>

                          {hasUniformResult ? (
                            <div className="text-sm font-medium text-cyan-100/65 md:text-right">
                              {exercise.sets.length > 1 &&
                                `${exercise.sets.length} × `}
                              {setResult(exercise.sets[0])}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 md:justify-end">
                              {exercise.sets.map((set) => (
                                <span
                                  key={set.stepId}
                                  className={cn(
                                    "rounded-full border px-2.5 py-1 text-xs",
                                    set.skipped
                                      ? "border-orange-200/10 bg-orange-200/[0.04] text-orange-100/55"
                                      : "border-cyan-200/10 bg-cyan-300/[0.04] text-cyan-100/60",
                                  )}
                                >
                                  S{set.iteration} · {setResult(set)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
        <div className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-100/55">
            <CheckCircle2 className="size-4" />
          </span>
          <div>
            <div className="text-sm font-medium text-white/70">
              Actividad registrada
            </div>
            <p className="mt-1 text-xs leading-relaxed text-white/35">
              No agregaste notas ni feedback a esta actividad.
            </p>
          </div>
        </div>
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
    (total, actividad) =>
      total +
      (actividad.durationSeconds !== null
        ? actividad.durationSeconds / 60
        : (actividad.durationMinutes ?? 0)),
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
            Abrí solo la actividad que quieras revisar para mantener el
            historial más ágil.
          </p>
        </div>
      )}

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
          <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {[
              [activities.length, "Actividades"],
              ...(activities.some(
                (actividad) =>
                  actividad.durationSeconds !== null ||
                  actividad.durationMinutes !== null,
              )
                ? [[Math.ceil(minutos), "Minutos"]]
                : []),
              [
                activities.filter((actividad) => actividad.type === "routine")
                  .length,
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
                <div className="text-xl font-light md:text-2xl">
                  {valor as number}
                </div>
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
                const { resumen, seriesCompletadas } =
                  resumenActividad(actividad);

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
                            {(actividad.durationSeconds !== null ||
                              actividad.durationMinutes !== null) && (
                              <ActivityChip
                                icon={<Clock3 className="size-3" />}
                                label={
                                  actividad.type === "routine"
                                    ? `${formatDuration(
                                        actividad.durationSeconds ??
                                          (actividad.durationMinutes ?? 0) * 60,
                                      )} reales`
                                    : `${actividad.durationMinutes ?? 0} min`
                                }
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
                                  label={countLabel(
                                    seriesCompletadas,
                                    "serie",
                                    "series",
                                  )}
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
