"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Dumbbell,
  Plus,
  Trash2,
} from "lucide-react";

import { ActivityHistory } from "@/components/activity-history";
import { SportsSchedule } from "@/features/schedule/sports-schedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { CompletedActivity } from "@/lib/rttp-activity";
import { NewScheduledWorkout, ScheduledWorkout } from "@/lib/rttp-agenda";
import { Routine, User } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

import { cantidadEjercicios } from "@/domain/routine/routine-metrics";
import {
  canCoachEditRoutine,
  routineCreatorLabel,
} from "@/domain/routine/routine-access";
import { OverviewRutina } from "@/features/athlete/routine-overview";
import { DialogoNuevaRutina } from "@/features/routine-editor/new-routine-dialog";
import { FilaEjercicio } from "@/features/routine-editor/exercise-row";
import { InlineSectionCreator } from "@/features/routine-editor/inline-section-creator";
import { RoutineDetailsFields } from "@/features/routine-editor/routine-details-fields";
import { SeccionEditor } from "@/features/routine-editor/section-editor";
import { SelectorRutina } from "@/features/routine-editor/routine-selector";
import { RoutineEditor } from "@/features/routine-editor/use-routine-editor";
import {
  pageDescriptionClassName,
  pageEyebrowClassName,
  pageTitleClassName,
} from "@/features/shared/page-shell";
import { TextWithLinks } from "@/features/shared/text-with-links";

export type CoachDetailSection = "routines" | "agenda" | "activities";

export function CoachAthleteDetailView({
  editor,
  hasRoutine,
  entrenador,
  atleta,
  routines,
  workouts,
  activities,
  seccionDetalle,
  setSeccionDetalle,
  hayCambios,
  hayEjerciciosSinNombre,
  guardadoVisible,
  guardar,
  navegar,
  navigate,
  verComoAtleta,
  crearYEditar,
  onSelect,
  onDeleteRutina,
  onCreateEntrenamiento,
  onUpdateEntrenamiento,
  onDeleteEntrenamiento,
}: {
  editor: RoutineEditor;
  hasRoutine: boolean;
  entrenador: User;
  atleta: User;
  routines: Routine[];
  workouts: ScheduledWorkout[];
  activities: CompletedActivity[];
  seccionDetalle: CoachDetailSection;
  setSeccionDetalle: (section: CoachDetailSection) => void;
  hayCambios: boolean;
  hayEjerciciosSinNombre: boolean;
  guardadoVisible: boolean;
  guardar: () => void;
  navegar: (action: () => void) => void;
  navigate: (path: string) => void;
  verComoAtleta: () => void;
  crearYEditar: (rutinaNueva: Routine) => void;
  onSelect: (id: string) => void;
  onDeleteRutina: (id: string) => void;
  onCreateEntrenamiento: (items: NewScheduledWorkout[]) => void;
  onUpdateEntrenamiento: (item: ScheduledWorkout) => void;
  onDeleteEntrenamiento: (id: string) => void;
}) {
  const {
    rutina,
    setRutina,
    openSectionId,
    setOpenSectionId,
    sensors,
    actualizarEjercicio,
    eliminarEjercicio,
    updateSectionKind,
    agregarEjercicioVacio,
    addSection,
    moverEjercicio,
  } = editor;
  const ejerciciosRutinaActiva = cantidadEjercicios(rutina);
  const canEditRoutine = canCoachEditRoutine(rutina, entrenador);
  const invalidRoutineTitle = !rutina.title.trim();
  const authorLabel = routineCreatorLabel(rutina, [entrenador, atleta], entrenador);

  return (
    <section id="routines-entrenador" className="scroll-mt-24">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/coach/athletes")}
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Todos los atletas
          </button>
          <div className={pageEyebrowClassName}>
            Planificación de {atleta.name}
          </div>
          <h1 className={pageTitleClassName}>
            {seccionDetalle === "routines"
              ? "Plan de entrenamiento"
              : seccionDetalle === "agenda"
                ? "Agenda deportiva"
                : "Actividades realizadas"}
          </h1>
          <p className={pageDescriptionClassName}>
            {seccionDetalle === "routines"
              ? "Armá secciones, completá ejercicios y ajustá la estructura antes de asignar nuevas cargas."
              : seccionDetalle === "agenda"
                ? "Programá sesiones internas y externas para darle contexto semanal al plan del atleta."
                : "Revisá lo que ya completó y corregí registros externos incluso después de realizarlos."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {seccionDetalle === "routines" && (
            <DialogoNuevaRutina
              atleta={atleta}
              createdById={entrenador.id}
              onCreate={crearYEditar}
            />
          )}
          <Button
            onClick={() => navegar(verComoAtleta)}
            className="rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
          >
            Vista atleta
            <ArrowRight />
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.025] p-1 sm:w-fit">
        {[
          ["routines", "Rutinas", Dumbbell],
          ["agenda", "Agenda", CalendarDays],
          ["activities", "Actividades", Activity],
        ].map(([value, label, Icon]) => {
          const TabIcon = Icon as typeof Dumbbell;
          return (
            <button
              key={value as string}
              onClick={() =>
                navegar(() =>
                  setSeccionDetalle(
                    value as "routines" | "agenda" | "activities",
                  ),
                )
              }
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs transition-colors",
                seccionDetalle === value
                  ? "bg-white/[0.09] text-white"
                  : "text-white/35 hover:text-white/65",
              )}
            >
              <TabIcon className="size-3.5" />
              {label as string}
            </button>
          );
        })}
      </div>

      {seccionDetalle === "routines" && !hasRoutine && (
        <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-white/[0.09] bg-white/[0.02] px-6 text-center">
          <div className="max-w-sm">
            <Dumbbell className="mx-auto size-8 text-cyan-200/60" />
            <h2 className="mt-4 text-xl font-medium">
              Todavía no hay rutinas visibles
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Creá el primer plan para {atleta.name}. Sus rutinas personales
              seguirán siendo privadas hasta que decida compartirlas.
            </p>
          </div>
        </div>
      )}

      {seccionDetalle === "routines" && hasRoutine && (
        <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-6">
          <div className="xl:sticky xl:top-24">
            <div className="mb-3 hidden items-center justify-between xl:flex">
              <span className="text-xs font-medium text-white/60">
                Rutinas asignadas
              </span>
              <span className="text-[10px] text-white/25">
                {countLabel(routines.length, "plan", "planes")}
              </span>
            </div>
            <SelectorRutina
              routines={routines}
              rutinaActiva={rutina}
              onSelect={(id) => navegar(() => onSelect(id))}
              authorLabel={(item) =>
                routineCreatorLabel(item, [entrenador, atleta], entrenador)
              }
              desktopVertical
            />
          </div>

          <Card className="overflow-hidden border-white/[0.08] bg-app-panel text-white shadow-[0_24px_70px_rgba(37,28,100,.18)]">
            <CardHeader className="border-b border-indigo-200/[0.07] p-4 md:p-5 xl:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {canEditRoutine ? (
                    <>
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-cyan-100/70">
                        {authorLabel}
                      </p>
                      <p className="mt-2 text-sm text-white/60">
                        {countLabel(ejerciciosRutinaActiva, "ejercicio")} ·
                        Editá los datos directamente debajo.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-xl font-medium">{rutina.title}</div>
                      <p className="mt-1 text-sm text-indigo-100/60">
                        <TextWithLinks>{rutina.objective}</TextWithLinks>
                        {rutina.durationMinutes
                          ? ` · ${rutina.durationMinutes} min`
                          : ""}{" "}
                        · {countLabel(ejerciciosRutinaActiva, "ejercicio")}
                      </p>
                      <p className="mt-2 text-xs text-cyan-100/70">
                        {authorLabel}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {canEditRoutine && !hayCambios && (
                    <div className="flex items-center gap-1 text-[10px] text-cyan-200/55">
                      <Check className="size-3" />
                      {guardadoVisible ? "Cambios guardados" : "Guardado"}
                    </div>
                  )}
                  <OverviewRutina
                    rutina={rutina}
                    authorLabel={authorLabel}
                  />
                  {canEditRoutine && hayCambios && (
                    <Button
                      onClick={guardar}
                      disabled={hayEjerciciosSinNombre || invalidRoutineTitle}
                      title={
                        hayEjerciciosSinNombre
                          ? "Completá el nombre del ejercicio nuevo"
                          : invalidRoutineTitle
                            ? "Completá el nombre de la rutina"
                            : undefined
                      }
                      className="rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-[0_10px_30px_rgba(79,70,229,.2)] hover:brightness-110"
                    >
                      <Check />
                      {hayEjerciciosSinNombre
                        ? "Completá el ejercicio"
                        : invalidRoutineTitle
                          ? "Completá el nombre"
                          : "Guardar cambios"}
                    </Button>
                  )}
                  {canEditRoutine && (
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar rutina"
                            title="Eliminar rutina"
                            className="rounded-full text-white/25 hover:bg-red-400/10 hover:text-red-200"
                          />
                        }
                      >
                        <Trash2 />
                      </DialogTrigger>
                      <DialogContent className="border-white/10 bg-app-panel text-white">
                        <DialogHeader>
                          <DialogTitle>
                            ¿Eliminar “{rutina.title}”?
                          </DialogTitle>
                          <DialogDescription className="text-white/40">
                            La rutina dejará de estar disponible para{" "}
                            {atleta.name}. También se quitarán sus entrenamientos
                            programados. Esta acción no se puede deshacer.
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
                                onClick={() => onDeleteRutina(rutina.id)}
                                className="bg-red-500 text-white hover:bg-red-400"
                              />
                            }
                          >
                            Eliminar rutina
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              {canEditRoutine && (
                <div className="mt-5 border-t border-white/[0.06] pt-5">
                  <RoutineDetailsFields
                    routine={rutina}
                    onUpdate={setRutina}
                    compact
                  />
                </div>
              )}
              {!canEditRoutine && (
                <div className="mt-4 rounded-2xl border border-violet-200/12 bg-violet-300/[0.06] px-4 py-3 text-xs leading-relaxed text-violet-100/70">
                  {atleta.name} compartió esta rutina para que puedas revisarla.
                  Solo el atleta puede editarla.
                </div>
              )}
              {ejerciciosRutinaActiva === 0 && (
                <div className="mt-4 rounded-2xl border border-amber-300/12 bg-amber-300/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-100/75">
                  {canEditRoutine
                    ? "Esta rutina todavía no tiene ejercicios. Sumá contenido antes de usarla como referencia o seguir avanzando con la planificación del atleta."
                    : "Esta rutina compartida todavía no tiene ejercicios."}
                </div>
              )}
              {canEditRoutine &&
                (hayEjerciciosSinNombre || invalidRoutineTitle) && (
                <div className="mt-4 rounded-2xl border border-amber-300/12 bg-amber-300/[0.06] px-4 py-3 text-sm leading-relaxed text-amber-100/80">
                  {hayEjerciciosSinNombre
                    ? "Completá el nombre del ejercicio nuevo para guardar la rutina."
                    : "Completá el nombre de la rutina para guardar los cambios."}
                </div>
                )}
            </CardHeader>
            <CardContent className="p-0">
              {canEditRoutine ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={moverEjercicio}
                >
                  {rutina.structure.sections.map((section, index) => (
                    <SeccionEditor
                      key={section.id}
                      section={section}
                      index={index}
                      abierto={openSectionId === section.id}
                      onToggle={() =>
                        setOpenSectionId((actual) =>
                          actual === section.id ? null : section.id,
                        )
                      }
                      onKindChange={(kind) =>
                        updateSectionKind(section.id, kind)
                      }
                      addExercise={
                        <button
                          type="button"
                          onClick={() => agregarEjercicioVacio(section.id)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-200/15 bg-cyan-300/[0.025] px-4 py-3 text-xs text-cyan-100/55 transition-colors hover:border-cyan-200/30 hover:bg-cyan-300/[0.06] hover:text-cyan-100"
                        >
                          <Plus className="size-3.5" />
                          Sumar ejercicio
                        </button>
                      }
                    >
                      {section.exercises.map((item) => (
                        <FilaEjercicio
                          key={item.id}
                          item={item}
                          sectionId={section.id}
                          onUpdate={(siguiente) =>
                            actualizarEjercicio(
                              section.id,
                              item.id,
                              siguiente,
                            )
                          }
                          onDelete={() =>
                            eliminarEjercicio(section.id, item.id)
                          }
                        />
                      ))}
                  </SeccionEditor>
                ))}
                <div className="border-t border-white/[0.06] p-3">
                  <InlineSectionCreator onCreate={addSection} />
                </div>
                </DndContext>
              ) : (
                <div className="p-5 text-sm text-white/50 md:p-7">
                  Abrí <span className="text-white/75">Vista general</span> para
                  revisar todas las secciones y ejercicios sin modificar el
                  plan personal del atleta.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      {seccionDetalle === "agenda" && (
        <SportsSchedule
          embedded
          modoCoach
          atleta={atleta}
          usuarioActual={entrenador}
          routines={routines}
          workouts={workouts}
          onCreate={onCreateEntrenamiento}
          onUpdate={onUpdateEntrenamiento}
          onDelete={onDeleteEntrenamiento}
          onStart={() => undefined}
        />
      )}
      {seccionDetalle === "activities" && (
        <ActivityHistory embedded activities={activities} />
      )}
    </section>
  );
}
