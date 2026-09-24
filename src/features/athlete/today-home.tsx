"use client";

import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { CompletedActivity } from "@/lib/rttp-activity";
import {
  addDays,
  activityCategories,
  localDate,
  ScheduledWorkout,
  startOfWeek,
} from "@/lib/rttp-agenda";
import { Routine, User } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

import { pasosDeRutina } from "@/domain/routine/routine-steps";
import { rutinaTieneEjercicios } from "@/domain/routine/routine-metrics";
import { routineCreatorLabel } from "@/domain/routine/routine-access";
import {
  completedSetsForSession,
  type TrainingSetRecords,
} from "@/domain/workout/workout-session";
import { OverviewRutina } from "@/features/athlete/routine-overview";
import {
  desktopPageShellClassName,
  pageDescriptionClassName,
  pageEyebrowClassName,
  pageTitleClassName,
} from "@/features/shared/page-shell";
import { TextWithLinks } from "@/features/shared/text-with-links";

function workoutTitle(item: ScheduledWorkout, routines: Routine[]) {
  if (item.origin === "external") return item.title;
  return (
    routines.find((routine) => routine.id === item.routineId)?.title ??
    "Rutina no disponible"
  );
}

function formatWorkoutDate(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

export function HomeHoy({
  atleta,
  viewer,
  users,
  routines,
  workouts,
  activities,
  records,
  onStart,
  onUpdate,
  navigate,
}: {
  atleta: User;
  viewer: User;
  users: User[];
  routines: Routine[];
  workouts: ScheduledWorkout[];
  activities: CompletedActivity[];
  records: TrainingSetRecords;
  onStart: (item: ScheduledWorkout) => void;
  onUpdate: (item: ScheduledWorkout) => void;
  navigate: (path: string) => void;
}) {
  const hoy = localDate();
  const soloLectura = viewer.role === "coach";
  const rutinasDisponibles = routines.filter(
    (routine) => routine.archivedAt === null,
  );
  const workoutIdsConActividad = new Set(
    activities.map((activity) => activity.scheduledWorkoutId),
  );
  const entrenamientoEnCurso = workouts
    .filter(
      (item) =>
        item.status === "in-progress" &&
        item.origin === "routine" &&
        item.routineId !== null,
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const pendientesDeHoy = workouts
    .filter((item) => item.date === hoy && item.status === "scheduled")
    .sort((a, b) => {
      if (a.origin !== b.origin) return a.origin === "routine" ? -1 : 1;
      return (a.time ?? "").localeCompare(b.time ?? "");
    });
  const completadosDeHoy = workouts.filter(
    (item) =>
      item.date === hoy &&
      item.status === "completed" &&
      workoutIdsConActividad.has(item.id),
  );
  const proximoEntrenamiento = workouts
    .filter(
      (item) =>
        item.date > hoy &&
        item.status !== "skipped" &&
        item.status !== "completed",
    )
    .sort((a, b) =>
      `${a.date}${a.time ?? ""}`.localeCompare(`${b.date}${b.time ?? ""}`),
    )[0];
  const entrenamientoPrioritario =
    entrenamientoEnCurso ?? pendientesDeHoy[0] ?? proximoEntrenamiento;
  const secundariosDeHoy = pendientesDeHoy.filter(
    (item) => item.id !== entrenamientoPrioritario?.id,
  );
  const siguienteEntrenamiento =
    entrenamientoPrioritario &&
    entrenamientoPrioritario.id !== proximoEntrenamiento?.id
      ? proximoEntrenamiento
      : undefined;
  const inicioSemana = startOfWeek(hoy);
  const diasDeLaSemana = Array.from({ length: 7 }, (_, index) =>
    addDays(inicioSemana, index),
  );
  const fechaHoy = formatWorkoutDate(hoy);

  function renderPrimaryWorkout(item: ScheduledWorkout) {
    const routine =
      item.origin === "routine"
        ? (routines.find((candidate) => candidate.id === item.routineId) ?? null)
        : null;
    const routineAvailable = routine ? rutinaTieneEjercicios(routine) : false;
    const isInProgress = item.status === "in-progress";
    const isFuture = item.date > hoy;
    const totalSets =
      routine && isInProgress ? pasosDeRutina(routine, item.id).length : 0;
    const completedSets = isInProgress
      ? completedSetsForSession(records, item.id)
      : 0;
    const categoryLabel =
      item.origin === "external"
        ? (activityCategories.find(
            (category) => category.value === item.category,
          )?.label ?? "Actividad externa")
        : null;

    return (
      <Card variant="hero" className="relative min-h-72 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,.17),transparent_38%),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.14),transparent_45%)]" />
        <CardContent className="relative flex h-full flex-col p-5 md:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isInProgress ? "brand" : "info"}>
              {isInProgress
                ? "En curso"
                : isFuture
                  ? "Próximo entrenamiento"
                  : "Programado para hoy"}
            </Badge>
            {categoryLabel && (
              <Badge variant="default">{categoryLabel}</Badge>
            )}
          </div>

          <div className="mt-5 max-w-2xl">
            <h2 className="text-2xl font-medium tracking-[-0.035em] md:text-3xl">
              {workoutTitle(item, routines)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-content-muted">
              {item.origin === "routine" ? (
                <TextWithLinks>
                  {routine?.objective ?? "Rutina asignada para esta sesión."}
                </TextWithLinks>
              ) : item.notes ? (
                <TextWithLinks>{item.notes}</TextWithLinks>
              ) : (
                "Actividad agendada fuera de RTTP."
              )}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-content-secondary">
            {isFuture && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-app-surface px-3 py-2">
                <CalendarDays className="size-3.5 text-info" />
                {formatWorkoutDate(item.date)}
              </span>
            )}
            {item.time && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-app-surface px-3 py-2">
                <Clock3 className="size-3.5 text-info" />
                {item.time}
              </span>
            )}
            {item.durationMinutes && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-app-surface px-3 py-2">
                <Clock3 className="size-3.5 text-info" />
                {item.durationMinutes} min
              </span>
            )}
          </div>

          {isInProgress && totalSets > 0 && (
            <Progress
              value={(completedSets / totalSets) * 100}
              className="mt-6 max-w-md gap-2"
              aria-label="Progreso de la rutina en curso"
            >
              <ProgressLabel className="text-xs text-content-secondary">
                Progreso
              </ProgressLabel>
              <span className="ml-auto text-xs tabular-nums text-content-secondary">
                {completedSets} de {totalSets} series
              </span>
            </Progress>
          )}

          {!soloLectura && (
            <div className="mt-auto flex flex-col gap-2 pt-7 sm:flex-row sm:items-center">
              {item.origin === "routine" && routine && !isFuture && (
                <OverviewRutina
                  rutina={routine}
                  authorLabel={routineCreatorLabel(routine, users, viewer)}
                  className="h-11 w-full justify-center px-5 text-xs sm:w-auto"
                />
              )}
              <Button
                onClick={() =>
                  isFuture
                    ? navigate("/schedule")
                    : item.origin === "routine"
                      ? onStart(item)
                      : onUpdate({ ...item, status: "completed" })
                }
                disabled={
                  !isFuture &&
                  item.origin === "routine" &&
                  !routineAvailable
                }
                className="h-11 w-full rounded-full sm:w-auto sm:px-7"
              >
                {isFuture
                  ? "Ver en agenda"
                  : item.origin === "routine"
                    ? !routineAvailable
                      ? "Rutina en preparación"
                      : isInProgress
                        ? "Continuar rutina"
                        : "Comenzar rutina"
                    : "Marcar como realizada"}
                <ArrowRight />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={desktopPageShellClassName}>
      <header className="mb-6">
        <div className={pageEyebrowClassName}>
          {fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1)}
        </div>
        <h1 className={pageTitleClassName}>Tu entrenamiento</h1>
        <p className={pageDescriptionClassName}>Hola, {atleta.name}.</p>
      </header>

      <div
        className={cn(
          "grid gap-4",
          entrenamientoPrioritario &&
            siguienteEntrenamiento &&
            "xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]",
        )}
      >
        {entrenamientoPrioritario ? (
          renderPrimaryWorkout(entrenamientoPrioritario)
        ) : (
          <Card variant="hero">
            <CardContent className="p-6 md:p-8">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-info dark:text-primary">
                {completadosDeHoy.length > 0 ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <Dumbbell className="size-5" />
                )}
              </div>
              <div className="mt-5 max-w-xl">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-info dark:text-primary">
                  {completadosDeHoy.length > 0 ? "Día completado" : "Hoy"}
                </div>
                <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">
                  {completadosDeHoy.length > 0
                    ? "Tu entrenamiento ya está hecho"
                    : rutinasDisponibles.length === 0
                      ? "Tu primera rutina empieza acá"
                      : "Hoy no tenés nada programado"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-content-muted">
                  {completadosDeHoy.length > 0
                    ? "Podés revisar lo que hiciste o elegir otra rutina si querés seguir."
                    : rutinasDisponibles.length === 0
                      ? "Armá una rutina simple y dejala lista para entrenar cuando quieras."
                      : "Elegí una de tus rutinas para entrenar ahora o revisá la agenda de la semana."}
                </p>
              </div>
              {!soloLectura && (
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="rounded-full"
                    onClick={() => navigate("/routines")}
                  >
                    {rutinasDisponibles.length === 0
                      ? "Crear mi primera rutina"
                      : "Elegir una rutina"}
                    <ArrowRight />
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() =>
                      navigate(
                        completadosDeHoy.length > 0
                          ? "/activities"
                          : "/schedule",
                      )
                    }
                  >
                    {completadosDeHoy.length > 0
                      ? "Ver historial"
                      : "Ver agenda"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {siguienteEntrenamiento && (
          <Card variant="flat">
            <CardContent className="flex h-full flex-col p-5 md:p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-content-muted">
                Próximo
              </div>
              <h2 className="mt-2 text-lg font-medium">
                {workoutTitle(siguienteEntrenamiento, routines)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-content-muted">
                {formatWorkoutDate(siguienteEntrenamiento.date)}
                {siguienteEntrenamiento.time
                  ? ` · ${siguienteEntrenamiento.time}`
                  : ""}
              </p>
              {!soloLectura && (
                <Button
                  variant="ghost"
                  className="mt-auto justify-between rounded-xl px-0 pt-6 text-info hover:bg-transparent dark:text-primary"
                  onClick={() => navigate("/schedule")}
                >
                  Ver agenda
                  <ArrowRight />
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {secundariosDeHoy.length > 0 && (
        <section className="mt-5" aria-labelledby="later-today-title">
          <h2 id="later-today-title" className="text-lg font-medium">
            Más tarde hoy
          </h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {secundariosDeHoy.map((item) => (
              <Card key={item.id} variant="flat">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {workoutTitle(item, routines)}
                    </div>
                    <div className="mt-1 text-xs text-content-muted">
                      {item.time ?? "Sin horario"}
                    </div>
                  </div>
                  {!soloLectura && (
                    <Button
                      variant="outline"
                      className="shrink-0 rounded-full"
                      disabled={
                        item.origin === "routine" &&
                        !routines.some(
                          (routine) =>
                            routine.id === item.routineId &&
                            rutinaTieneEjercicios(routine),
                        )
                      }
                      onClick={() =>
                        item.origin === "routine"
                          ? onStart(item)
                          : onUpdate({ ...item, status: "completed" })
                      }
                    >
                      {item.origin === "routine"
                        ? routines.some(
                            (routine) =>
                              routine.id === item.routineId &&
                              rutinaTieneEjercicios(routine),
                          )
                          ? "Empezar"
                          : "En preparación"
                        : "Completar"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {completadosDeHoy.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-success/15 bg-success/[0.04] px-4 py-3 text-sm text-content-secondary">
          <CheckCircle2 className="size-4 text-success" />
          {completadosDeHoy.length === 1
            ? "Completaste una actividad hoy."
            : `Completaste ${completadosDeHoy.length} actividades hoy.`}
          {!soloLectura && (
            <button
              type="button"
              onClick={() => navigate("/activities")}
              className="ml-auto text-sm font-medium text-info hover:underline dark:text-primary"
            >
              Ver historial
            </button>
          )}
        </div>
      )}

      <section
        className="mt-5 rounded-3xl border border-border bg-app-panel p-4 shadow-sm md:p-6 dark:border-white/[0.08] dark:shadow-none"
        aria-labelledby="week-title"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-content-muted">
              Tu semana
            </div>
            <h2 id="week-title" className="mt-1 text-lg font-medium">
              Ritmo reciente
            </h2>
          </div>
          {!soloLectura && (
            <button
              type="button"
              onClick={() => navigate("/activities")}
              className="text-xs font-medium text-content-muted hover:text-content-primary"
            >
              Ver historial
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
          {diasDeLaSemana.map((date) => {
            const dayActivities = activities.filter(
              (activity) => activity.date === date,
            );
            const dayWorkouts = workouts.filter(
              (workout) => workout.date === date,
            );
            const hasCompleted = dayActivities.length > 0;
            const hasInProgress = dayWorkouts.some(
              (workout) => workout.status === "in-progress",
            );
            const hasScheduled = dayWorkouts.some(
              (workout) => workout.status === "scheduled",
            );
            const hasSkipped = dayWorkouts.some(
              (workout) => workout.status === "skipped",
            );
            const isToday = date === hoy;
            const status = hasCompleted
              ? "completed"
              : hasInProgress
                ? "in-progress"
                : hasScheduled
                  ? "scheduled"
                  : hasSkipped
                    ? "skipped"
                    : "rest";
            const interactive =
              !soloLectura &&
              (hasCompleted || hasInProgress || hasScheduled || hasSkipped);
            const dateValue = new Date(`${date}T12:00:00`);
            const dayLabel = new Intl.DateTimeFormat("es-AR", {
              weekday: "short",
            })
              .format(dateValue)
              .replace(".", "")
              .slice(0, 3);
            const statusLabel = {
              completed: "Completado",
              "in-progress": "En curso",
              scheduled: "Programado",
              skipped: "Omitido",
              rest: "Sin actividad",
            }[status];

            return (
              <button
                key={date}
                type="button"
                disabled={!interactive}
                onClick={() =>
                  navigate(hasCompleted ? "/activities" : "/schedule")
                }
                aria-current={isToday ? "date" : undefined}
                aria-label={`${dayLabel} ${dateValue.getDate()}: ${statusLabel}`}
                className={cn(
                  "group flex min-w-0 flex-col items-center rounded-2xl border px-1 py-3 transition-colors sm:px-2",
                  isToday
                    ? "border-primary/35 bg-app-elevated ring-1 ring-primary/10"
                    : "border-border bg-app-surface dark:border-white/[0.06] dark:bg-white/[0.02]",
                  interactive &&
                    "cursor-pointer hover:border-primary/35 hover:bg-app-elevated",
                )}
              >
                <span className="text-[9px] font-semibold uppercase tracking-wider text-content-muted">
                  {dayLabel}
                </span>
                <span className="mt-1 text-sm font-medium tabular-nums">
                  {dateValue.getDate()}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-3 size-2.5 rounded-full border",
                    status === "completed" &&
                      "border-cyan-500 bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,.45)]",
                    status === "in-progress" &&
                      "border-violet-500 bg-violet-500",
                    status === "scheduled" &&
                      "border-cyan-600 bg-transparent dark:border-cyan-200/70",
                    status === "skipped" &&
                      "border-warning/60 bg-warning/20",
                    status === "rest" &&
                      "border-foreground/15 bg-foreground/5",
                  )}
                />
              </button>
            );
          })}
        </div>
      </section>

      {!soloLectura && entrenamientoPrioritario && (
        <button
          type="button"
          onClick={() => navigate("/routines")}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-content-muted transition-colors hover:text-content-primary"
        >
          Entrenar sin planificación
          <ArrowRight className="size-4" />
        </button>
      )}

      {soloLectura && (
        <div className="mt-5 inline-flex items-center gap-2 text-sm text-content-muted">
          <Activity className="size-4" />
          Estás viendo el inicio del atleta en modo solo lectura.
        </div>
      )}
    </div>
  );
}
