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
import { SportsSchedule } from "@/components/sports-schedule";
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
import { DialogoDetallesRutina } from "@/features/routine-editor/dialogo-detalles-rutina";
import { DialogoEjercicio } from "@/features/routine-editor/dialogo-ejercicio";
import { DialogoNuevaRutina } from "@/features/routine-editor/dialogo-nueva-rutina";
import { FilaEjercicio } from "@/features/routine-editor/fila-ejercicio";
import { SeccionEditor } from "@/features/routine-editor/seccion-editor";
import { SelectorRutina } from "@/features/routine-editor/selector-rutina";
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
  onCreateEntrenamiento: (item: NewScheduledWorkout) => void;
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
    agregarEjercicio,
    agregarEjercicioVacio,
    moverEjercicio,
  } = editor;
  const ejerciciosRutinaActiva = cantidadEjercicios(rutina);

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
            <DialogoNuevaRutina atleta={atleta} onCreate={crearYEditar} />
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

      {seccionDetalle === "routines" && (
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
              desktopVertical
            />
          </div>

          <Card className="overflow-hidden border-white/[0.08] bg-app-panel text-white shadow-[0_24px_70px_rgba(37,28,100,.18)]">
            <CardHeader className="border-b border-indigo-200/[0.07] p-4 md:p-5 xl:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-medium xl:text-xl">
                    {rutina.title}
                  </div>
                  <p className="mt-1 text-[11px] text-indigo-100/35 xl:text-xs">
                    <TextWithLinks>{rutina.objective}</TextWithLinks>
                    {rutina.durationMinutes
                      ? ` · ${rutina.durationMinutes} min`
                      : ""}{" "}
                    · {countLabel(ejerciciosRutinaActiva, "ejercicio")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {!hayCambios && (
                    <div className="flex items-center gap-1 text-[10px] text-cyan-200/55">
                      <Check className="size-3" />
                      {guardadoVisible ? "Cambios guardados" : "Guardado"}
                    </div>
                  )}
                  <DialogoDetallesRutina
                    rutina={rutina}
                    onUpdate={setRutina}
                  />
                  {hayCambios && (
                    <Button
                      onClick={guardar}
                      disabled={hayEjerciciosSinNombre}
                      title={
                        hayEjerciciosSinNombre
                          ? "Completá el nombre del ejercicio nuevo"
                          : undefined
                      }
                      className="rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-[0_10px_30px_rgba(79,70,229,.2)] hover:brightness-110"
                    >
                      <Check />
                      {hayEjerciciosSinNombre
                        ? "Completá el ejercicio"
                        : "Guardar cambios"}
                    </Button>
                  )}
                  <Dialog>
                    <DialogTrigger
                      disabled={routines.length <= 1}
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar rutina"
                          title={
                            routines.length <= 1
                              ? "Creá otra rutina antes de eliminar esta"
                              : "Eliminar rutina"
                          }
                          className="rounded-full text-white/25 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-20"
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
                          {atleta.name}. También se quitarán sus
                          entrenamientos programados. Esta acción no se
                          puede deshacer.
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
                </div>
              </div>
              {ejerciciosRutinaActiva === 0 && (
                <div className="mt-4 rounded-2xl border border-amber-300/12 bg-amber-300/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-100/75">
                  Esta rutina todavía no tiene ejercicios. Sumá contenido
                  antes de usarla como referencia o seguir avanzando con la
                  planificación del atleta.
                </div>
              )}
              {hayEjerciciosSinNombre && (
                <div className="mt-4 rounded-2xl border border-amber-300/12 bg-amber-300/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-100/75">
                  Completá el nombre del ejercicio nuevo para guardar la
                  rutina.
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
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
                    onKindChange={(kind) => updateSectionKind(section.id, kind)}
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
                <div
                  key={`new-section-control-${rutina.structure.sections.length}`}
                  className="border-t border-white/[0.06] p-3"
                >
                  <DialogoEjercicio
                    sections={rutina.structure.sections}
                    initialSectionId="nuevo"
                    trigger={
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-200/15 bg-violet-300/[0.025] px-4 py-4 text-xs text-violet-100/55 transition-colors hover:border-violet-200/30 hover:bg-violet-300/[0.06] hover:text-violet-100"
                      >
                        <Plus className="size-3.5" />
                        Crear sección
                      </button>
                    }
                    onAdd={agregarEjercicio}
                  />
                </div>
              </DndContext>
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
