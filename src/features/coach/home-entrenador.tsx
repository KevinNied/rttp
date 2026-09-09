"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompletedActivity } from "@/lib/rttp-activity";
import { NewScheduledWorkout, ScheduledWorkout } from "@/lib/rttp-agenda";
import { Routine, User } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

import { RoutineTemplate } from "@/domain/routine/routine-factory";
import { nuevaRutinaBase } from "@/domain/routine/routine-factory";
import { canCoachEditRoutine } from "@/domain/routine/routine-access";
import { CoachView } from "@/application/navigation/routes";
import { useRoutineEditor } from "@/features/routine-editor/use-routine-editor";
import {
  CoachAthleteDetailView,
  type CoachDetailSection,
} from "@/features/coach/coach-athlete-detail-view";
import { CoachAthletesView } from "@/features/coach/coach-athletes-view";
import { CoachOverviewView } from "@/features/coach/coach-overview-view";
import { CoachTemplatesView } from "@/features/coach/coach-templates-view";
import { desktopPageShellClassName } from "@/features/shared/page-shell";

export function HomeEntrenador({
  entrenador,
  users,
  atletas,
  atleta,
  routines,
  rutinasPorAtleta,
  workouts,
  activities,
  templates,
  vista,
  detalleAtleta,
  rutina: rutinaGuardada,
  onSelectAtleta,
  onSelect,
  onSaveRutina,
  onCreateRutina,
  onSaveAsTemplate,
  onAssignTemplate,
  onDeleteTemplate,
  onCreateAtleta,
  onDeleteRutina,
  onCreateEntrenamiento,
  onUpdateEntrenamiento,
  onDeleteEntrenamiento,
  onDirtyChange,
  verComoAtleta,
  navigate,
}: {
  entrenador: User;
  users: User[];
  atletas: User[];
  atleta: User;
  routines: Routine[];
  rutinasPorAtleta: Routine[];
  workouts: ScheduledWorkout[];
  activities: CompletedActivity[];
  templates: RoutineTemplate[];
  vista: CoachView;
  detalleAtleta: boolean;
  rutina?: Routine;
  onSelectAtleta: (id: number) => void;
  onSelect: (id: string) => void;
  onSaveRutina: (rutina: Routine) => void;
  onCreateRutina: (rutina: Routine) => void;
  onSaveAsTemplate: (rutina: Routine, title: string) => void;
  onAssignTemplate: (plantillaId: string, athleteId: number) => void;
  onDeleteTemplate: (plantillaId: string) => void;
  onCreateAtleta: (name: string, email: string) => Promise<string | null>;
  onDeleteRutina: (id: string) => void;
  onCreateEntrenamiento: (item: NewScheduledWorkout) => void;
  onUpdateEntrenamiento: (item: ScheduledWorkout) => void;
  onDeleteEntrenamiento: (id: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  verComoAtleta: () => void;
  navigate: (path: string) => void;
}) {
  const [rutinaVacia] = useState<Routine>(() => ({
    ...nuevaRutinaBase(entrenador.id),
    athleteId: atleta.id,
  }));
  const editor = useRoutineEditor(rutinaGuardada ?? rutinaVacia);
  const { rutina, setRutina, setOpenSectionId } = editor;
  const [seccionDetalle, setSeccionDetalle] =
    useState<CoachDetailSection>("routines");
  const [accionPendiente, setAccionPendiente] = useState<(() => void) | null>(
    null,
  );
  const [guardadoVisible, setGuardadoVisible] = useState(false);
  const [plantillaGuardadaVisible, setPlantillaGuardadaVisible] =
    useState(false);
  const hayCambios =
    rutinaGuardada !== undefined &&
    JSON.stringify(rutina) !== JSON.stringify(rutinaGuardada);
  const rutinaEditable =
    rutinaGuardada && canCoachEditRoutine(rutinaGuardada, entrenador);
  const hayEjerciciosSinNombre = rutina.structure.sections.some((section) =>
    section.exercises.some((exercise) => !exercise.name.trim()),
  );

  useEffect(() => {
    if (!hayCambios) return;
    const advertirSalida = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", advertirSalida);
    return () => window.removeEventListener("beforeunload", advertirSalida);
  }, [hayCambios]);

  useEffect(() => {
    onDirtyChange(hayCambios);
    return () => onDirtyChange(false);
  }, [hayCambios, onDirtyChange]);

  function guardar() {
    onSaveRutina(rutina);
    setGuardadoVisible(true);
    window.setTimeout(() => setGuardadoVisible(false), 1800);
  }

  function navegar(action: () => void) {
    if (!hayCambios) {
      action();
      return;
    }
    setAccionPendiente(() => action);
  }

  function continuarDespuesDeGuardar() {
    onSaveRutina(rutina);
    accionPendiente?.();
    setAccionPendiente(null);
  }

  function descartarYContinuar() {
    if (rutinaGuardada) setRutina(rutinaGuardada);
    accionPendiente?.();
    setAccionPendiente(null);
  }

  function crearYEditar(rutinaNueva: Routine) {
    onCreateRutina(rutinaNueva);
    setOpenSectionId(rutinaNueva.structure.sections[0]?.id ?? null);
  }

  return (
    <div
      id="inicio-entrenador"
      className={cn(desktopPageShellClassName, "scroll-mt-24")}
    >
      {vista === "resumen" && (
        <CoachOverviewView
          atletas={atletas}
          templates={templates}
          rutinasPorAtleta={rutinasPorAtleta}
          navigate={navigate}
        />
      )}

      {vista === "atletas" && !detalleAtleta && (
        <CoachAthletesView
          users={users}
          atletas={atletas}
          rutinasPorAtleta={rutinasPorAtleta}
          onCreateAtleta={onCreateAtleta}
          onSelectAtleta={onSelectAtleta}
          navigate={navigate}
        />
      )}

      {vista === "routines" && (
        <CoachTemplatesView
          rutina={rutinaEditable ? rutina : undefined}
          templates={templates}
          atletas={atletas}
          plantillaGuardadaVisible={plantillaGuardadaVisible}
          onSaveTemplate={(title) => {
            onSaveAsTemplate(rutina, title);
            setPlantillaGuardadaVisible(true);
            window.setTimeout(() => setPlantillaGuardadaVisible(false), 2400);
          }}
          onAssignTemplate={onAssignTemplate}
          onDeleteTemplate={onDeleteTemplate}
          navegar={navegar}
        />
      )}

      {detalleAtleta && (
        <CoachAthleteDetailView
          editor={editor}
          hasRoutine={rutinaGuardada !== undefined}
          entrenador={entrenador}
          atleta={atleta}
          routines={routines}
          workouts={workouts}
          activities={activities}
          seccionDetalle={seccionDetalle}
          setSeccionDetalle={setSeccionDetalle}
          hayCambios={hayCambios}
          hayEjerciciosSinNombre={hayEjerciciosSinNombre}
          guardadoVisible={guardadoVisible}
          guardar={guardar}
          navegar={navegar}
          navigate={navigate}
          verComoAtleta={verComoAtleta}
          crearYEditar={crearYEditar}
          onSelect={onSelect}
          onDeleteRutina={onDeleteRutina}
          onCreateEntrenamiento={onCreateEntrenamiento}
          onUpdateEntrenamiento={onUpdateEntrenamiento}
          onDeleteEntrenamiento={onDeleteEntrenamiento}
        />
      )}

      <Dialog
        open={Boolean(accionPendiente)}
        onOpenChange={(open) => {
          if (!open) setAccionPendiente(null);
        }}
      >
        <DialogContent className="border-white/10 bg-app-panel text-white">
          <DialogHeader>
            <DialogTitle>Tenés cambios sin guardar</DialogTitle>
            <DialogDescription className="text-white/40">
              Guardalos antes de continuar o descartá esta edición.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <DialogClose
              render={<Button variant="ghost" className="text-white/50" />}
            >
              Seguir editando
            </DialogClose>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={descartarYContinuar}
                className="border-white/10 bg-transparent text-white/65 hover:bg-white/[0.06] hover:text-white"
              >
                Descartar
              </Button>
              <Button
                onClick={continuarDespuesDeGuardar}
                disabled={hayEjerciciosSinNombre}
                title={
                  hayEjerciciosSinNombre
                    ? "Completá el nombre del ejercicio nuevo"
                    : undefined
                }
                className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
              >
                Guardar y continuar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
