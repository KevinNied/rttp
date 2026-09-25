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

import {
  nuevaRutinaBase,
  RoutineTemplate,
} from "@/domain/routine/routine-factory";
import {
  coachAthletePath,
  type CoachAthleteSection,
  CoachView,
} from "@/application/navigation/routes";
import { SyncState } from "@/application/sync/sync-state";
import { useRoutineEditor } from "@/features/routine-editor/use-routine-editor";
import { CoachAthleteDetailView } from "@/features/coach/coach-athlete-detail-view";
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
  seccionDetalle,
  syncState,
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
  atleta?: User;
  routines: Routine[];
  rutinasPorAtleta: Routine[];
  workouts: ScheduledWorkout[];
  activities: CompletedActivity[];
  templates: RoutineTemplate[];
  vista: CoachView;
  detalleAtleta: boolean;
  seccionDetalle: CoachAthleteSection;
  syncState: SyncState;
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
  onCreateEntrenamiento: (items: NewScheduledWorkout[]) => void;
  onUpdateEntrenamiento: (item: ScheduledWorkout) => void;
  onDeleteEntrenamiento: (id: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  verComoAtleta: () => void;
  navigate: (path: string) => void;
}) {
  const [rutinaVacia] = useState<Routine>(() => ({
    ...nuevaRutinaBase(entrenador.id),
    athleteId: atleta?.id ?? 0,
  }));
  const editor = useRoutineEditor(rutinaGuardada ?? rutinaVacia);
  const { rutina, setRutina, setOpenSectionId } = editor;
  const [draftRoutine, setDraftRoutine] = useState<Routine | null>(null);
  const [accionPendiente, setAccionPendiente] = useState<(() => void) | null>(
    null,
  );
  const [plantillaGuardadaVisible, setPlantillaGuardadaVisible] =
    useState(false);
  const hayCambios =
    draftRoutine !== null ||
    (rutinaGuardada !== undefined &&
      JSON.stringify(rutina) !== JSON.stringify(rutinaGuardada));
  const hayEjerciciosSinNombre = rutina.structure.sections.some((section) =>
    section.exercises.some((exercise) => !exercise.name.trim()),
  );

  useEffect(() => {
    onDirtyChange(hayCambios);
    return () => onDirtyChange(false);
  }, [hayCambios, onDirtyChange]);

  function guardar() {
    if (draftRoutine) {
      onCreateRutina(rutina);
      setDraftRoutine(null);
    } else {
      onSaveRutina(rutina);
    }
  }

  function navegar(action: () => void) {
    if (!hayCambios) {
      action();
      return;
    }
    setAccionPendiente(() => action);
  }

  function continuarDespuesDeGuardar() {
    if (draftRoutine) {
      onCreateRutina(rutina);
      setDraftRoutine(null);
    } else {
      onSaveRutina(rutina);
    }
    accionPendiente?.();
    setAccionPendiente(null);
  }

  function descartarYContinuar() {
    setDraftRoutine(null);
    setRutina(rutinaGuardada ?? rutinaVacia);
    accionPendiente?.();
    setAccionPendiente(null);
  }

  function crearYEditar(rutinaNueva: Routine) {
    setDraftRoutine(rutinaNueva);
    setRutina(rutinaNueva);
    setOpenSectionId(rutinaNueva.structure.sections[0]?.id ?? null);
  }

  function eliminarRutina(id: string) {
    if (draftRoutine?.id === id) {
      setDraftRoutine(null);
      setRutina(rutinaGuardada ?? rutinaVacia);
      setOpenSectionId(rutinaGuardada?.structure.sections[0]?.id ?? null);
      return;
    }
    onDeleteRutina(id);
  }

  return (
    <div
      id="inicio-entrenador"
      className={cn(desktopPageShellClassName, "scroll-mt-24")}
    >
      {vista === "resumen" && (
        <CoachOverviewView
          users={users}
          atletas={atletas}
          atletaSeleccionado={atleta}
          templates={templates}
          rutinasPorAtleta={rutinasPorAtleta}
          onCreateAtleta={onCreateAtleta}
          onSelectAtleta={onSelectAtleta}
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
          templates={templates}
          atletas={atletas}
          onAssignTemplate={(templateId, athleteId) => {
            onAssignTemplate(templateId, athleteId);
            navigate(coachAthletePath(athleteId));
          }}
          onDeleteTemplate={onDeleteTemplate}
          navegar={navegar}
        />
      )}

      {detalleAtleta && atleta && (
        <CoachAthleteDetailView
          editor={editor}
          hasRoutine={rutinaGuardada !== undefined || draftRoutine !== null}
          entrenador={entrenador}
          atleta={atleta}
          routines={routines}
          workouts={workouts}
          activities={activities}
          seccionDetalle={seccionDetalle}
          hayCambios={hayCambios}
          isDraft={draftRoutine !== null}
          syncState={syncState}
          hayEjerciciosSinNombre={hayEjerciciosSinNombre}
          guardar={guardar}
          plantillaGuardadaVisible={plantillaGuardadaVisible}
          onSaveAsTemplate={(title) => {
            onSaveAsTemplate(rutina, title);
            setPlantillaGuardadaVisible(true);
            window.setTimeout(() => setPlantillaGuardadaVisible(false), 2400);
          }}
          navegar={navegar}
          navigate={navigate}
          verComoAtleta={verComoAtleta}
          crearYEditar={crearYEditar}
          onSelect={onSelect}
          onDeleteRutina={eliminarRutina}
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
        <DialogContent className="border-border bg-app-panel text-foreground">
          <DialogHeader>
            <DialogTitle>Tenés cambios sin guardar</DialogTitle>
            <DialogDescription className="text-content-muted">
              Guardalos antes de continuar o descartá esta edición.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <DialogClose
              render={<Button variant="ghost" />}
            >
              Seguir editando
            </DialogClose>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={descartarYContinuar}
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
