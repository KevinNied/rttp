"use client";

import { useEffect, useRef, useState } from "react";

import { ActivitySet } from "@/lib/rttp-activity";
import {
  localDate,
  NewScheduledWorkout,
  ScheduledWorkout,
} from "@/lib/rttp-agenda";
import { Routine, User } from "@/lib/rttp-data";

import { pasosDeRutina } from "@/domain/routine/routine-steps";
import { activitySetsForSession } from "@/domain/workout/workout-activity";
import {
  completedSetsForSession,
  recordsForSession,
  recordsWithoutSession,
  RestTimerState,
  TrainingSetRecords,
  WorkoutTimerState,
} from "@/domain/workout/workout-session";
import { workoutPersistence } from "@/application/workout/workout-persistence";
import { AthleteRoutineEditor } from "@/features/athlete/athlete-routine-editor";
import { HomeAtleta } from "@/features/athlete/athlete-home";
import { RutinaCompletada } from "@/features/workout/completed-routine";
import { WorkoutMode } from "@/features/workout/workout-mode";

export function ExperienciaAtleta({
  atleta,
  viewer,
  users,
  coach,
  routines,
  rutina,
  entrenamientoInicial,
  entrenamientoPausado,
  onSelect,
  onCreateEntrenamiento,
  onUpdateEntrenamiento,
  onCompleteRoutine,
  onSaveRoutine,
  onCreateRoutine,
  onDuplicateRoutine,
  onArchiveRoutine,
  onRestoreRoutine,
  onDeleteRoutine,
  onCancelWorkout,
  onCloseScheduled,
  onWorkoutModeChange,
  onDirtyChange,
  registros,
  setRegistros,
}: {
  atleta: User;
  viewer: User;
  users: User[];
  coach?: User;
  routines: Routine[];
  rutina?: Routine;
  entrenamientoInicial?: ScheduledWorkout;
  entrenamientoPausado?: ScheduledWorkout;
  onSelect: (id: string) => void;
  onCreateEntrenamiento: (item: NewScheduledWorkout) => ScheduledWorkout;
  onUpdateEntrenamiento: (item: ScheduledWorkout) => void;
  onCompleteRoutine: (data: {
    entrenamiento: ScheduledWorkout;
    rutina: Routine;
    sets: ActivitySet[];
    elapsedSeconds: number;
    effort: number;
    feedback: string;
  }) => void;
  onSaveRoutine: (routine: Routine) => void;
  onCreateRoutine: (routine: Routine) => void;
  onDuplicateRoutine: (routine: Routine) => Routine | null;
  onArchiveRoutine: (routine: Routine) => void;
  onRestoreRoutine: (routine: Routine) => void;
  onDeleteRoutine: (id: string) => void;
  onCancelWorkout: (id: string) => void;
  onCloseScheduled: () => void;
  onWorkoutModeChange: (active: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  registros: TrainingSetRecords;
  setRegistros: React.Dispatch<React.SetStateAction<TrainingSetRecords>>;
}) {
  const entrenamientoRestaurado = entrenamientoInicial ?? entrenamientoPausado;
  const sesionRestaurada = entrenamientoRestaurado
    ? workoutPersistence.readSession(entrenamientoRestaurado.id)
    : null;
  const ultimoIndiceDisponible = entrenamientoRestaurado
    ? Math.max(
        0,
        rutina
          ? pasosDeRutina(rutina, entrenamientoRestaurado.id).length - 1
          : 0,
      )
    : 0;
  const [pantalla, setPantalla] = useState<"home" | "workout" | "final">(() =>
    entrenamientoInicial
      ? (sesionRestaurada?.phase ?? "workout")
      : (sesionRestaurada?.phase ?? "home"),
  );
  const [indiceActivo, setIndiceActivo] = useState(
    Math.min(sesionRestaurada?.activeIndex ?? 0, ultimoIndiceDisponible),
  );
  const indiceActivoSeguro = Math.min(indiceActivo, ultimoIndiceDisponible);
  const [feedback, setFeedback] = useState(sesionRestaurada?.feedback ?? "");
  const [entrenamiento, setEntrenamiento] = useState<
    ScheduledWorkout | undefined
  >(entrenamientoRestaurado);
  const [timer, setTimer] = useState<WorkoutTimerState | null>(() =>
    entrenamientoRestaurado
      ? pantalla === "workout"
        ? workoutPersistence.resumeTimer(entrenamientoRestaurado.id)
        : workoutPersistence.readTimer(entrenamientoRestaurado.id)
      : null,
  );
  const [finishedElapsedSeconds, setFinishedElapsedSeconds] = useState(
    sesionRestaurada?.finishedElapsedSeconds ?? 0,
  );
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(
    sesionRestaurada?.restTimer ?? null,
  );
  const [routineBeingEdited, setRoutineBeingEdited] =
    useState<Routine | null>(null);
  const completedSessionRef = useRef(false);
  const sesionId = entrenamiento?.id;
  const progreso = sesionId
    ? completedSetsForSession(registros, sesionId)
    : 0;

  useEffect(() => {
    onWorkoutModeChange(pantalla === "workout");
    return () => onWorkoutModeChange(false);
  }, [onWorkoutModeChange, pantalla]);

  useEffect(() => {
    if (!entrenamiento || !rutina || completedSessionRef.current) return;
    workoutPersistence.writeSession({
      workoutId: entrenamiento.id,
      routineId: rutina.id,
      athleteId: atleta.id,
      phase: pantalla,
      activeIndex: indiceActivoSeguro,
      records: recordsForSession(registros, entrenamiento.id),
      finishedElapsedSeconds,
      feedback,
      restTimer,
    });
  }, [
    atleta.id,
    entrenamiento,
    feedback,
    finishedElapsedSeconds,
    indiceActivoSeguro,
    pantalla,
    registros,
    restTimer,
    rutina,
  ]);

  function reset() {
    if (!sesionId) return;
    setRegistros((actuales) => recordsWithoutSession(actuales, sesionId));
    setIndiceActivo(0);
    setRestTimer(null);
    setFinishedElapsedSeconds(0);
    setFeedback("");
    setTimer(workoutPersistence.restartTimer(sesionId));
  }

  function iniciar() {
    if (!rutina) return;
    completedSessionRef.current = false;
    if (entrenamiento && rutina) {
      const enCurso = { ...entrenamiento, status: "in-progress" as const };
      setTimer(workoutPersistence.resumeTimer(enCurso.id));
      setEntrenamiento(enCurso);
      onUpdateEntrenamiento(enCurso);
      setPantalla("workout");
      return;
    }

    const creado = onCreateEntrenamiento({
      athleteId: atleta.id,
      date: localDate(),
      time: null,
      durationMinutes: rutina.durationMinutes,
      status: "in-progress",
      createdById: atleta.id,
      notes: "",
      origin: "routine",
      routineId: rutina.id,
      title: null,
      category: null,
    });
    setTimer(workoutPersistence.resumeTimer(creado.id));
    setEntrenamiento(creado);
    setPantalla("workout");
  }

  function cerrarEntrenamiento() {
    if (entrenamiento && rutina) {
      workoutPersistence.pauseTimer(entrenamiento.id);
      workoutPersistence.writeSession({
        workoutId: entrenamiento.id,
        routineId: rutina.id,
        athleteId: atleta.id,
        phase: "home",
        activeIndex: indiceActivoSeguro,
        records: recordsForSession(registros, entrenamiento.id),
        finishedElapsedSeconds,
        feedback,
        restTimer,
      });
    }
    if (entrenamientoInicial) {
      onCloseScheduled();
      return;
    }
    setPantalla("home");
  }

  function cancelarEntrenamiento() {
    if (!sesionId) return;
    completedSessionRef.current = true;
    onCancelWorkout(sesionId);
    setEntrenamiento(undefined);
    setPantalla("home");
    setIndiceActivo(0);
    setRestTimer(null);
    setFinishedElapsedSeconds(0);
    setFeedback("");
    onCloseScheduled();
  }

  function eliminarRutina(id: string) {
    if (entrenamiento?.origin === "routine" && entrenamiento.routineId === id) {
      completedSessionRef.current = true;
      setEntrenamiento(undefined);
      setPantalla("home");
      setIndiceActivo(0);
      setTimer(null);
      setRestTimer(null);
      setFinishedElapsedSeconds(0);
      setFeedback("");
    }
    onDeleteRoutine(id);
  }

  if (routineBeingEdited) {
    return (
      <AthleteRoutineEditor
        key={routineBeingEdited.id}
        routine={routineBeingEdited}
        coach={coach}
        onSave={(routine) => {
          onSaveRoutine(routine);
          setRoutineBeingEdited(routine);
        }}
        onClose={() => setRoutineBeingEdited(null)}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  if (pantalla === "workout" && sesionId && timer && rutina) {
    return (
      <WorkoutMode
        rutina={rutina}
        sesionId={sesionId}
        timer={timer}
        registros={registros}
        setRegistros={setRegistros}
        indiceActivo={indiceActivoSeguro}
        setIndiceActivo={setIndiceActivo}
        restTimer={restTimer}
        setRestTimer={setRestTimer}
        onExit={cerrarEntrenamiento}
        onCancel={cancelarEntrenamiento}
        onFinish={() => {
          setFinishedElapsedSeconds(workoutPersistence.pauseTimer(sesionId));
          setRestTimer(null);
          setPantalla("final");
        }}
      />
    );
  }

  if (pantalla === "final" && rutina) {
    return (
      <RutinaCompletada
        atleta={atleta}
        elapsedSeconds={finishedElapsedSeconds}
        feedback={feedback}
        setFeedback={setFeedback}
        onDone={(effort) => {
          if (entrenamiento) {
            const completado = {
              ...entrenamiento,
              status: "completed" as const,
            };
            const sets = activitySetsForSession(
              rutina,
              entrenamiento.id,
              registros,
            );
            setEntrenamiento(completado);
            onUpdateEntrenamiento(completado);
            onCompleteRoutine({
              entrenamiento: completado,
              rutina,
              sets,
              elapsedSeconds: finishedElapsedSeconds,
              effort,
              feedback: feedback.trim(),
            });
            completedSessionRef.current = true;
            workoutPersistence.clearTimer(entrenamiento.id);
            workoutPersistence.clearSession(entrenamiento.id);
            setRegistros((actuales) =>
              recordsWithoutSession(actuales, entrenamiento.id),
            );
          }
          setEntrenamiento(undefined);
          setPantalla("home");
          setIndiceActivo(0);
          setRestTimer(null);
          onCloseScheduled();
        }}
      />
    );
  }

  return (
    <HomeAtleta
      athlete={atleta}
      viewer={viewer}
      users={users}
      coach={coach}
      readOnly={viewer.role === "coach"}
      routines={routines}
      rutina={rutina}
      onSelect={(id) => {
        if (sesionId) workoutPersistence.pauseTimer(sesionId);
        onSelect(id);
        setIndiceActivo(0);
        setEntrenamiento(undefined);
        setRestTimer(null);
      }}
      onStart={iniciar}
      onCreateAndEdit={(routine) => {
        onCreateRoutine(routine);
        setRoutineBeingEdited(routine);
      }}
      onEdit={setRoutineBeingEdited}
      onDuplicate={(routine) => {
        const copy = onDuplicateRoutine(routine);
        if (copy) setRoutineBeingEdited(copy);
      }}
      onArchive={onArchiveRoutine}
      onRestore={onRestoreRoutine}
      onDelete={eliminarRutina}
      progreso={progreso}
      onReset={reset}
    />
  );
}
