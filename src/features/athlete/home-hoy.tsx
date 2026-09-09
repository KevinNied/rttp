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
import { countLabel } from "@/lib/format";
import {
  activityCategories,
  localDate,
  ScheduledWorkout,
} from "@/lib/rttp-agenda";
import { Routine, User } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

import {
  cantidadEjercicios,
  rutinaTieneEjercicios,
} from "@/domain/routine/routine-metrics";
import { routineCreatorLabel } from "@/domain/routine/routine-access";
import { OverviewRutina } from "@/features/athlete/overview-rutina";
import {
  desktopPageShellClassName,
  pageDescriptionClassName,
  pageEyebrowClassName,
  pageTitleClassName,
} from "@/features/shared/page-shell";
import { TextWithLinks } from "@/features/shared/text-with-links";

export function HomeHoy({
  atleta,
  viewer,
  users,
  routines,
  workouts,
  onStart,
  onUpdate,
  navigate,
}: {
  atleta: User;
  viewer: User;
  users: User[];
  routines: Routine[];
  workouts: ScheduledWorkout[];
  onStart: (item: ScheduledWorkout) => void;
  onUpdate: (item: ScheduledWorkout) => void;
  navigate: (path: string) => void;
}) {
  const hoy = localDate();
  const fechaLegible = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${hoy}T12:00:00`));
  const entrenamientosDeHoy = workouts
    .filter((item) => item.date === hoy && item.status !== "skipped")
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
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

  return (
    <div className={desktopPageShellClassName}>
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <div className={pageEyebrowClassName}>Tu día</div>
          <h1 className={pageTitleClassName}>Tu entrenamiento de hoy</h1>
          <p className={pageDescriptionClassName}>
            Hola, {atleta.name}. {fechaLegible}
          </p>
        </div>
      </div>

      {entrenamientosDeHoy.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {entrenamientosDeHoy.map((entrenamiento) => {
              const completed = entrenamiento.status === "completed";
              const rutina =
                entrenamiento.origin === "routine"
                  ? (routines.find(
                      (item) => item.id === entrenamiento.routineId,
                    ) ?? null)
                  : null;
              const rutinaDisponible = rutina
                ? rutinaTieneEjercicios(rutina)
                : false;
              const categoryLabel =
                entrenamiento.origin === "external"
                  ? (activityCategories.find(
                      (category) => category.value === entrenamiento.category,
                    )?.label ?? "Actividad externa")
                  : null;

              return (
                <Card
                  key={entrenamiento.id}
                  className="relative overflow-hidden border-white/[0.09] bg-app-panel text-white shadow-[0_24px_70px_rgba(0,0,0,.35)]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,.15),transparent_38%),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.13),transparent_45%)]" />
                  <CardContent className="relative p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-cyan-100/55">
                          {entrenamiento.time && (
                            <>
                              <Clock3 className="size-3" />
                              <span>{entrenamiento.time}</span>
                            </>
                          )}
                          {entrenamiento.origin === "external" &&
                            categoryLabel && (
                              <span className="rounded-full border border-violet-200/15 bg-violet-300/10 px-2 py-1 text-[9px] text-violet-100/70">
                                {categoryLabel}
                              </span>
                            )}
                        </div>
                        <h2 className="mt-4 text-2xl font-light tracking-[-0.03em]">
                          {entrenamiento.origin === "routine"
                            ? (rutina?.title ?? "Rutina no disponible")
                            : entrenamiento.title}
                        </h2>
                        <p className="mt-2 text-xs leading-relaxed text-white/35">
                          {entrenamiento.origin === "routine" ? (
                            <TextWithLinks>
                              {rutina?.objective ?? "Rutina asignada para hoy."}
                            </TextWithLinks>
                          ) : entrenamiento.notes ? (
                            <TextWithLinks>{entrenamiento.notes}</TextWithLinks>
                          ) : (
                            "Actividad agendada fuera de RTTP para registrar como realizada cuando termines."
                          )}
                        </p>
                      </div>
                      {completed && (
                        <Badge
                          className={cn(
                            "shrink-0 text-[9px]",
                            entrenamiento.origin === "routine"
                              ? "border-emerald-200/10 bg-emerald-300/10 text-emerald-200"
                              : "border-violet-200/10 bg-violet-300/10 text-violet-100",
                          )}
                        >
                          <CheckCircle2 />
                          {entrenamiento.origin === "routine"
                            ? "Completada"
                            : "Realizada"}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {entrenamiento.durationMinutes && (
                        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/25 px-3 py-2 text-[10px] text-white/55">
                          <Clock3 className="size-3 text-cyan-200" />
                          {entrenamiento.durationMinutes} min
                        </div>
                      )}
                      {entrenamiento.origin === "routine" && rutina && (
                        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/25 px-3 py-2 text-[10px] text-white/55">
                          <Dumbbell className="size-3 text-violet-200" />
                          {countLabel(cantidadEjercicios(rutina), "ejercicio")}
                        </div>
                      )}
                      {entrenamiento.origin === "routine" &&
                        rutina &&
                        !rutinaDisponible && (
                          <div className="flex items-center gap-2 rounded-full border border-amber-300/12 bg-amber-300/[0.08] px-3 py-2 text-[10px] text-amber-100/75">
                            <Dumbbell className="size-3" />
                            Rutina en preparación
                          </div>
                        )}
                      {entrenamiento.origin === "external" && (
                        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/25 px-3 py-2 text-[10px] text-white/55">
                          <Activity className="size-3 text-violet-200" />
                          Actividad externa
                        </div>
                      )}
                    </div>

                    {!completed && (
                      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                        {entrenamiento.origin === "routine" && rutina && (
                          <OverviewRutina
                            rutina={rutina}
                            authorLabel={routineCreatorLabel(
                              rutina,
                              users,
                              viewer,
                            )}
                            className="h-11 w-full justify-center px-5 text-xs sm:w-auto"
                          />
                        )}
                        <Button
                          onClick={() =>
                            entrenamiento.origin === "routine"
                              ? onStart(entrenamiento)
                              : onUpdate({
                                  ...entrenamiento,
                                  status: "completed",
                                })
                          }
                          disabled={
                            entrenamiento.origin === "routine" &&
                            rutina !== null &&
                            !rutinaDisponible
                          }
                          className="h-11 w-full rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200 sm:w-auto sm:px-7"
                        >
                          {entrenamiento.origin === "routine"
                            ? !rutinaDisponible
                              ? "Rutina en preparación"
                              : entrenamiento.status === "in-progress"
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
            })}
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
                  Inicio rápido
                </div>
                <h2 className="mt-2 text-lg font-medium text-white/90">
                  ¿Salió un entrenamiento no planificado?
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-white/38 md:text-sm">
                  Entrá a tus rutinas y empezá una al instante sin depender de
                  la agenda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/routines")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/[0.1] px-5 text-xs font-medium text-white/75 transition-colors hover:border-cyan-200/30 hover:bg-white/[0.04] hover:text-white"
              >
                Ir a mis rutinas
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-white/[0.09] bg-white/[0.02] px-6 text-center">
            <div>
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-cyan-300/[0.08] text-cyan-100/55">
                <CalendarDays className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-medium">
                No tenés entrenamientos para hoy
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-white/35">
                Podés descansar, revisar tu semana o programar una rutina desde
                la agenda.
              </p>
              <button
                type="button"
                onClick={() => navigate("/schedule")}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-cyan-300 px-5 text-xs font-medium text-indigo-950 transition-colors hover:bg-cyan-200"
              >
                Ver agenda
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {proximoEntrenamiento && (
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 text-left md:p-6">
                <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
                  Próximo turno
                </div>
                <h2 className="mt-2 text-lg font-medium text-white/90">
                  {proximoEntrenamiento.origin === "routine"
                    ? (routines.find(
                        (item) => item.id === proximoEntrenamiento.routineId,
                      )?.title ?? "Rutina agendada")
                    : proximoEntrenamiento.title}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-white/38 md:text-sm">
                  {new Intl.DateTimeFormat("es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }).format(new Date(`${proximoEntrenamiento.date}T12:00:00`))}
                  {proximoEntrenamiento.time
                    ? ` · ${proximoEntrenamiento.time}`
                    : ""}
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/schedule")}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.1] px-5 text-xs font-medium text-white/75 transition-colors hover:border-cyan-200/30 hover:bg-white/[0.04] hover:text-white"
                >
                  Ver semana completa
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 text-left md:p-6">
              <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
                Inicio rápido
              </div>
              <h2 className="mt-2 text-lg font-medium text-white/90">
                ¿Estás por entrenar?
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-white/38 md:text-sm">
                Si te surgió una sesión no planificada, abrí tus rutinas y
                arrancá en segundos.
              </p>
              <button
                type="button"
                onClick={() => navigate("/routines")}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.1] px-5 text-xs font-medium text-white/75 transition-colors hover:border-cyan-200/30 hover:bg-white/[0.04] hover:text-white"
              >
                Ir a mis rutinas
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
