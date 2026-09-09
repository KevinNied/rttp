"use client";

import {
  Archive,
  ArrowRight,
  Clock3,
  Copy,
  Dumbbell,
  LayoutGrid,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { countLabel } from "@/lib/format";
import { Routine, User } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

import {
  canAthleteEditRoutine,
  isAthleteOwnedRoutine,
  routineCreatorLabel,
} from "@/domain/routine/routine-access";
import {
  cantidadEjercicios,
  rutinaTieneEjercicios,
} from "@/domain/routine/routine-metrics";
import { OverviewRutina } from "@/features/athlete/overview-rutina";
import { DialogoNuevaRutina } from "@/features/routine-editor/dialogo-nueva-rutina";
import { SelectorRutina } from "@/features/routine-editor/selector-rutina";
import {
  desktopPageShellClassName,
  pageDescriptionClassName,
  pageEyebrowClassName,
  pageTitleClassName,
} from "@/features/shared/page-shell";
import { TextWithLinks } from "@/features/shared/text-with-links";

type RoutineFilter = "all" | "mine" | "coach" | "archived";

export function HomeAtleta({
  athlete,
  viewer,
  users,
  coach,
  readOnly = false,
  routines,
  rutina,
  onSelect,
  onStart,
  onCreateAndEdit,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  progreso,
  onReset,
}: {
  athlete: User;
  viewer: User;
  users: User[];
  coach?: User;
  readOnly?: boolean;
  routines: Routine[];
  rutina?: Routine;
  onSelect: (id: string) => void;
  onStart: () => void;
  onCreateAndEdit: (routine: Routine) => void;
  onEdit: (routine: Routine) => void;
  onDuplicate: (routine: Routine) => void;
  onArchive: (routine: Routine) => void;
  onRestore: (routine: Routine) => void;
  progreso: number;
  onReset: () => void;
}) {
  const [filter, setFilter] = useState<RoutineFilter>("all");
  const activeRoutines = routines.filter((item) => item.archivedAt === null);
  const archivedRoutines = routines.filter((item) => item.archivedAt !== null);
  const hasCoachRoutines = routines.some(
    (item) => !isAthleteOwnedRoutine(item),
  );
  const filteredRoutines =
    filter === "mine"
      ? activeRoutines.filter(isAthleteOwnedRoutine)
      : filter === "coach"
        ? activeRoutines.filter((item) => !isAthleteOwnedRoutine(item))
        : filter === "archived"
          ? archivedRoutines
          : activeRoutines;
  const visibleRoutine = filteredRoutines.find(
    (item) => item.id === rutina?.id,
  );
  const exerciseCount = visibleRoutine
    ? cantidadEjercicios(visibleRoutine)
    : 0;
  const routineIncomplete = visibleRoutine
    ? !rutinaTieneEjercicios(visibleRoutine)
    : false;
  const editable =
    !readOnly &&
    visibleRoutine !== undefined &&
    canAthleteEditRoutine(visibleRoutine, athlete.id);
  const authorLabel = (routine: Routine) =>
    routineCreatorLabel(routine, users, viewer);

  function selectFilter(nextFilter: RoutineFilter) {
    setFilter(nextFilter);
    const nextRoutines =
      nextFilter === "mine"
        ? activeRoutines.filter(isAthleteOwnedRoutine)
        : nextFilter === "coach"
          ? activeRoutines.filter((item) => !isAthleteOwnedRoutine(item))
          : nextFilter === "archived"
            ? archivedRoutines
            : activeRoutines;
    if (
      nextRoutines.length > 0 &&
      !nextRoutines.some((item) => item.id === rutina?.id)
    ) {
      onSelect(nextRoutines[0].id);
    }
  }

  function archiveRoutine(routine: Routine) {
    onArchive(routine);
    if (activeRoutines.every((item) => item.id === routine.id)) {
      setFilter("archived");
    }
  }

  return (
    <div className={desktopPageShellClassName}>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className={pageEyebrowClassName}>Tu biblioteca</div>
          <h1 className={pageTitleClassName}>Todas tus rutinas</h1>
          <p className={pageDescriptionClassName}>
            {coach || hasCoachRoutines
              ? "Combiná tus propios planes con los que creó tu coach y entrená a tu manera."
              : "Creá, organizá y entrená con tus propios planes a tu manera."}
          </p>
        </div>
        {!readOnly && (
          <DialogoNuevaRutina
            atleta={athlete}
            createdById={athlete.id}
            onCreate={onCreateAndEdit}
          />
        )}
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.025] p-1 sm:w-fit">
        {(
          [
            ["all", "Todas"],
            ["mine", "Mías"],
            ...(hasCoachRoutines
              ? ([["coach", "Coach"]] as const)
              : []),
            ...(archivedRoutines.length > 0
              ? ([["archived", "Archivadas"]] as const)
              : []),
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => selectFilter(value)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-xs transition-colors",
              filter === value
                ? "bg-white/[0.09] text-white"
                : "text-white/35 hover:text-white/65",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-6">
        <aside className="xl:sticky xl:top-24">
          <div className="mb-3 hidden items-center justify-between xl:flex">
            <span className="text-xs font-medium text-white/60">
              {filter === "archived" ? "Rutinas archivadas" : "Tus rutinas"}
            </span>
            <span className="text-[10px] text-white/25">
              {countLabel(filteredRoutines.length, "plan", "planes")}
            </span>
          </div>
          {filteredRoutines.length > 0 ? (
            <SelectorRutina
              routines={filteredRoutines}
              rutinaActiva={visibleRoutine}
              onSelect={onSelect}
              authorLabel={authorLabel}
              desktopVertical
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.02] px-4 py-8 text-center text-xs leading-relaxed text-white/40">
              {filter === "archived"
                ? "No tenés rutinas archivadas."
                : filter === "coach"
                  ? "No tenés rutinas creadas por un coach."
                  : "Todavía no hay rutinas en esta vista."}
            </div>
          )}
        </aside>

        {visibleRoutine ? (
          <Card className="relative overflow-hidden border-white/[0.09] bg-app-panel text-white shadow-[0_30px_80px_rgba(0,0,0,.45)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(34,211,238,.18),transparent_35%),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.18),transparent_42%)]" />
            <CardContent className="relative p-5 md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-cyan-200/15 bg-cyan-300/10 text-[9px] text-cyan-100">
                    {authorLabel(visibleRoutine)}
                  </Badge>
                  {visibleRoutine.sharedWithCoachId === coach?.id && (
                    <Badge className="border-violet-200/15 bg-violet-300/10 text-[9px] text-violet-100">
                      Compartida con {coach.name}
                    </Badge>
                  )}
                  {visibleRoutine.archivedAt && (
                    <Badge className="border-amber-200/15 bg-amber-300/10 text-[9px] text-amber-100">
                      Archivada
                    </Badge>
                  )}
                </div>
                <OverviewRutina
                  rutina={visibleRoutine}
                  authorLabel={authorLabel(visibleRoutine)}
                />
              </div>

              <div className="mt-10 md:mt-12">
                <h2 className="text-3xl font-light tracking-[-0.04em] md:text-4xl">
                  {visibleRoutine.title}
                </h2>
                <p className="mt-2 text-xs text-indigo-100/40">
                  <TextWithLinks>{visibleRoutine.objective}</TextWithLinks>
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    ...(visibleRoutine.durationMinutes
                      ? [[Clock3, `${visibleRoutine.durationMinutes} min`]]
                      : []),
                    [Dumbbell, countLabel(exerciseCount, "ejercicio")],
                    [
                      LayoutGrid,
                      countLabel(
                        visibleRoutine.structure.sections.length,
                        "sección",
                        "secciones",
                      ),
                    ],
                  ].map(([Icon, value]) => {
                    const InfoIcon = Icon as typeof Clock3;
                    return (
                      <div
                        key={value as string}
                        className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[10px] text-white/70"
                      >
                        <InfoIcon className="size-3 text-cyan-200" />
                        {value as string}
                      </div>
                    );
                  })}
                </div>

                {readOnly ? (
                  <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-white/50">
                    Estás viendo la experiencia del atleta en modo de solo
                    lectura.
                  </div>
                ) : visibleRoutine.archivedAt ? (
                  <Button
                    onClick={() => {
                      onRestore(visibleRoutine);
                      setFilter("all");
                    }}
                    className="mt-6 h-11 w-full rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200 sm:w-auto sm:px-7"
                  >
                    <RotateCcw />
                    Restaurar rutina
                  </Button>
                ) : (
                  <>
                    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        onClick={onStart}
                        disabled={routineIncomplete}
                        className="h-11 rounded-full bg-indigo-50 text-indigo-950 hover:bg-cyan-100 sm:px-7"
                      >
                        {routineIncomplete
                          ? "Rutina en preparación"
                          : progreso
                            ? "Continuar rutina"
                            : "Comenzar rutina"}
                        <ArrowRight />
                      </Button>
                      {editable ? (
                        <Button
                          variant="outline"
                          onClick={() => onEdit(visibleRoutine)}
                          className="h-11 rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"
                        >
                          <Pencil />
                          Editar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => onDuplicate(visibleRoutine)}
                          className="h-11 rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"
                        >
                          <Copy />
                          Duplicar y editar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => archiveRoutine(visibleRoutine)}
                        className="h-11 rounded-full text-white/40 hover:bg-white/[0.06] hover:text-white"
                      >
                        <Archive />
                        Archivar
                      </Button>
                    </div>
                    {routineIncomplete && (
                      <p className="mt-3 max-w-md text-[11px] leading-relaxed text-amber-100/70">
                        {editable
                          ? "Esta rutina todavía no tiene ejercicios. Editala para completar el plan antes de entrenar."
                          : "Tu coach todavía no cargó ejercicios en esta rutina."}
                      </p>
                    )}
                    {progreso > 0 && (
                      <Dialog>
                        <DialogTrigger
                          render={
                            <button className="mt-3 text-[10px] text-white/30 transition-colors hover:text-white/70" />
                          }
                        >
                          Reiniciar progreso
                        </DialogTrigger>
                        <DialogContent className="border-white/10 bg-app-panel text-white">
                          <DialogHeader>
                            <DialogTitle>¿Reiniciar esta rutina?</DialogTitle>
                            <DialogDescription className="text-white/45">
                              Se eliminarán todas las series registradas de esta
                              rutina. Esta acción no se puede deshacer.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose
                              render={
                                <Button
                                  variant="ghost"
                                  className="text-white/50"
                                />
                              }
                            >
                              Cancelar
                            </DialogClose>
                            <DialogClose
                              render={
                                <Button
                                  variant="destructive"
                                  onClick={onReset}
                                  className="bg-red-500 text-white hover:bg-red-400"
                                />
                              }
                            >
                              Sí, reiniciar
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-white/[0.09] bg-white/[0.02] px-6 text-center">
            <div className="max-w-sm">
              <Dumbbell className="mx-auto size-8 text-cyan-200/60" />
              <h2 className="mt-4 text-xl font-medium">
                {filter === "archived"
                  ? "No hay rutinas archivadas"
                  : "Creá tu primera rutina"}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-white/40">
                {filter === "archived"
                  ? "Las rutinas que archives aparecerán acá para que puedas restaurarlas."
                  : "No necesitás un coach para empezar. Armá un plan propio desde una rutina en blanco."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
