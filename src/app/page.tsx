"use client";

import { useState } from "react";

import { ActivityHistory } from "@/components/activity-history";
import { SportsSchedule } from "@/features/schedule/sports-schedule";
import { activityId, ActivitySet, CompletedActivity } from "@/lib/rttp-activity";
import {
  createWorkoutId,
  NewScheduledWorkout,
  ScheduledWorkout,
} from "@/lib/rttp-agenda";
import { initialRoutines, Routine, User } from "@/lib/rttp-data";
import { createAthleteWithRoutine } from "@/lib/rttp-supabase";
import { supabaseConfigured } from "@/lib/supabase";

import {
  duplicateRoutineForAthlete,
  idPlantilla,
  nuevaRutinaBase,
  rutinaDesdePlantilla,
  snapshotRoutine,
} from "@/domain/routine/routine-factory";
import {
  canAthleteEditRoutine,
  canCoachEditRoutine,
  visibleRoutinesForCoach,
} from "@/domain/routine/routine-access";
import { rutinaTieneEjercicios } from "@/domain/routine/routine-metrics";
import {
  recordsWithoutSession,
  recordsWithoutSessions,
} from "@/domain/workout/workout-session";
import {
  clearUserSession,
  persistCurrentUser,
  persistSelectedAthlete,
} from "@/application/session/user-session";
import { workoutPersistence } from "@/application/workout/workout-persistence";
import { useAppData } from "@/application/data/use-app-data";
import {
  athleteIdForPath,
  athleteViewForPath,
  coachViewForPath,
  isAthleteDetailPath,
} from "@/application/navigation/routes";
import {
  useAppNavigation,
  useRoleRedirect,
} from "@/application/navigation/use-app-navigation";
import { syncErrorMessage } from "@/application/sync/sync-error";
import { ExperienciaAtleta } from "@/features/athlete/athlete-experience";
import { HomeHoy } from "@/features/athlete/today-home";
import { PerfilUsuario } from "@/features/athlete/user-profile";
import { HomeEntrenador } from "@/features/coach/coach-home";
import { LandingAcceso } from "@/features/landing/access-landing";
import { ConfirmationDialog } from "@/features/shared/confirmation-dialog";
import { AppShell } from "@/features/shell/app-shell";

export default function Home() {
  const { pathname, navigate, replaceNavigate } = useAppNavigation();
  const atletaRutaId = athleteIdForPath(pathname);
  const {
    hydrated,
    syncError,
    setSyncError,
    persist,
    users,
    setUsers,
    routines,
    setRoutines,
    templates,
    setTemplates,
    workouts,
    setWorkouts,
    activities,
    setActivities,
    records: registros,
    setRecords: setRegistros,
    userId,
    setUserId,
    selectedAthleteId: atletaSeleccionadoId,
    setSelectedAthleteId: setAtletaSeleccionadoId,
  } = useAppData(atletaRutaId);
  const [entrenamientoActivoId, setEntrenamientoActivoId] = useState<
    string | null
  >(null);
  const [routineId, setRutinaId] = useState(initialRoutines[0].id);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);
  const [workoutImmersive, setWorkoutImmersive] = useState(false);
  const [activityPendingDeletion, setActivityPendingDeletion] =
    useState<CompletedActivity | null>(null);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const usuario = users.find((item) => item.id === userId) ?? null;
  const atletasDelCoach = users.filter(
    (item) => item.role === "athlete" && usuario?.athleteIds?.includes(item.id),
  );
  const atleta =
    usuario?.role === "athlete"
      ? usuario
      : (atletasDelCoach.find((item) => item.id === atletaSeleccionadoId) ??
        atletasDelCoach[0]);
  const entrenadorDelAtleta = atleta
    ? users.find(
        (item) => item.role === "coach" && item.athleteIds?.includes(atleta.id),
      )
    : undefined;
  const todasLasRutinasDelAtleta = atleta
    ? routines.filter((item) => item.athleteId === atleta.id)
    : [];
  const rutinasDelAtleta =
    atleta && usuario?.role === "coach"
      ? visibleRoutinesForCoach(routines, usuario, atleta.id)
      : todasLasRutinasDelAtleta;
  const rutina =
    rutinasDelAtleta.find((item) => item.id === routineId) ??
    rutinasDelAtleta.find((item) => item.archivedAt === null) ??
    rutinasDelAtleta[0];
  const entrenamientoActivo = workouts.find(
    (item) => item.id === entrenamientoActivoId,
  );
  const entrenamientoPausado = workouts
    .filter(
      (item) =>
        item.athleteId === atleta?.id &&
        item.origin === "routine" &&
        item.routineId === rutina?.id &&
        item.status === "in-progress",
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const rutinaDeEntrenamiento =
    entrenamientoActivo?.origin === "routine"
      ? (rutinasDelAtleta.find(
          (item) => item.id === entrenamientoActivo.routineId,
        ) ?? rutina)
      : rutina;
  const detalleAtleta = isAthleteDetailPath(pathname);
  const vistaEntrenador = coachViewForPath(pathname);
  const vistaAtleta = athleteViewForPath(pathname);

  useRoleRedirect({ hydrated, pathname, user: usuario, replaceNavigate });

  function guardarRutina(rutinaGuardada: Routine) {
    if (!usuario) return;
    const rutinaPersistida = routines.find(
      (item) => item.id === rutinaGuardada.id,
    );
    if (
      !rutinaPersistida ||
      rutinaGuardada.athleteId !== rutinaPersistida.athleteId ||
      rutinaGuardada.createdById !== rutinaPersistida.createdById
    ) {
      setSyncError("No se pudo validar la identidad de la rutina.");
      return;
    }
    const canSave =
      usuario.role === "athlete"
        ? canAthleteEditRoutine(rutinaPersistida, usuario.id)
        : canCoachEditRoutine(rutinaPersistida, usuario);
    const rutinaValidada =
      usuario.role === "athlete" &&
      rutinaGuardada.sharedWithCoachId !== entrenadorDelAtleta?.id
        ? { ...rutinaGuardada, sharedWithCoachId: null }
        : rutinaGuardada;
    const coachPreservedOwnershipState =
      usuario.role !== "coach" ||
      (rutinaValidada.sharedWithCoachId ===
        rutinaPersistida.sharedWithCoachId &&
        rutinaValidada.archivedAt === rutinaPersistida.archivedAt);
    if (!canSave || !coachPreservedOwnershipState) {
      setSyncError("No tenés permiso para editar esta rutina.");
      return;
    }
    setRoutines((actuales) =>
      actuales.map((item) =>
        item.id === rutinaValidada.id ? rutinaValidada : item,
      ),
    );
    persist({ type: "save-routines", data: [rutinaValidada] });
  }

  function acceder(email: string) {
    const usuarioEncontrado = users.find(
      (item) => item.email === email.trim().toLowerCase(),
    );
    if (!usuarioEncontrado) return false;

    const athleteId =
      usuarioEncontrado.role === "athlete"
        ? usuarioEncontrado.id
        : (usuarioEncontrado.athleteIds?.[0] ?? 1);
    const rutinasDisponibles =
      usuarioEncontrado.role === "coach"
        ? visibleRoutinesForCoach(routines, usuarioEncontrado, athleteId)
        : routines.filter((item) => item.athleteId === athleteId);
    const primeraRutina =
      rutinasDisponibles.find((item) => item.archivedAt === null) ??
      rutinasDisponibles[0];
    setUserId(usuarioEncontrado.id);
    setAtletaSeleccionadoId(athleteId);
    setRutinaId(primeraRutina?.id ?? "");
    setVistaPrevia(false);
    persistCurrentUser(usuarioEncontrado.id);
    replaceNavigate(usuarioEncontrado.role === "coach" ? "/coach" : "/");
    return true;
  }

  function seleccionarAtleta(id: number) {
    const rutinasDisponibles =
      usuario?.role === "coach"
        ? visibleRoutinesForCoach(routines, usuario, id)
        : routines.filter((item) => item.athleteId === id);
    const primeraRutina =
      rutinasDisponibles.find((item) => item.archivedAt === null) ??
      rutinasDisponibles[0];
    setAtletaSeleccionadoId(id);
    persistSelectedAthlete(id);
    setRutinaId(primeraRutina?.id ?? "");
    setRegistros({});
  }

  function crearRutina(rutinaNueva: Routine) {
    if (
      !usuario ||
      rutinaNueva.createdById !== usuario.id ||
      rutinaNueva.sharedWithCoachId !== null ||
      rutinaNueva.archivedAt !== null
    ) {
      setSyncError("No se pudo validar la autoría de la rutina.");
      return;
    }
    const canCreate =
      usuario.role === "athlete"
        ? rutinaNueva.athleteId === usuario.id
        : usuario.athleteIds?.includes(rutinaNueva.athleteId) === true;
    if (!canCreate) {
      setSyncError("No tenés permiso para crear esta rutina.");
      return;
    }
    setRoutines((actuales) => [...actuales, rutinaNueva]);
    setRutinaId(rutinaNueva.id);
    persist({ type: "save-routines", data: [rutinaNueva] });
  }

  function crearEntrenamiento(item: NewScheduledWorkout): ScheduledWorkout {
    return crearEntrenamientos([item])[0];
  }

  function crearEntrenamientos(items: NewScheduledWorkout[]) {
    const ahora = new Date().toISOString();
    const creados: ScheduledWorkout[] = items.map((item) => ({
      ...item,
      id: createWorkoutId(),
      createdAt: ahora,
      updatedAt: ahora,
    }));
    setWorkouts((actuales) => [...actuales, ...creados]);
    persist({ type: "save-workouts", data: creados });
    return creados;
  }

  function actualizarEntrenamiento(item: ScheduledWorkout) {
    const actualizado = {
      ...item,
      updatedAt: new Date().toISOString(),
    };
    setWorkouts((actuales) =>
      actuales.map((actual) => (actual.id === item.id ? actualizado : actual)),
    );
    persist({ type: "save-workouts", data: [actualizado] });
    if (item.origin === "external" && item.status === "completed") {
      const actividad: CompletedActivity = {
        id: activityId(item.id),
        athleteId: item.athleteId,
        scheduledWorkoutId: item.id,
        type: "external",
        title: item.title,
        category: item.category,
        routineId: null,
        routineSnapshot: null,
        date: item.date,
        completedAt: new Date().toISOString(),
        durationMinutes: item.durationMinutes,
        durationSeconds: null,
        effort: null,
        feedback: "",
        notes: item.notes,
        sets: [],
        recordedById: usuario?.id ?? item.athleteId,
      };
      setActivities((actuales) =>
        actuales.some((actual) => actual.scheduledWorkoutId === item.id)
          ? actuales
          : [...actuales, actividad],
      );
      persist({ type: "save-activity", data: actividad });
    }
  }

  function registrarActividadRutina({
    entrenamiento,
    rutina: rutinaCompletada,
    sets,
    elapsedSeconds,
    effort,
    feedback,
  }: {
    entrenamiento: ScheduledWorkout;
    rutina: Routine;
    sets: ActivitySet[];
    elapsedSeconds: number;
    effort: number;
    feedback: string;
  }) {
    const actividad: CompletedActivity = {
      id: activityId(entrenamiento.id),
      athleteId: entrenamiento.athleteId,
      scheduledWorkoutId: entrenamiento.id,
      type: "routine",
      title: rutinaCompletada.title,
      category: null,
      routineId: rutinaCompletada.id,
      routineSnapshot: {
        ...snapshotRoutine(rutinaCompletada),
        durationSeconds: elapsedSeconds,
      },
      date: entrenamiento.date,
      completedAt: new Date().toISOString(),
      durationMinutes: Math.max(1, Math.ceil(elapsedSeconds / 60)),
      durationSeconds: elapsedSeconds,
      effort,
      feedback,
      notes: entrenamiento.notes,
      sets,
      recordedById: usuario?.id ?? entrenamiento.athleteId,
    };
    workoutPersistence.clearTimer(entrenamiento.id);
    workoutPersistence.clearSession(entrenamiento.id);
    setActivities((actuales) =>
      actuales.some((actual) => actual.scheduledWorkoutId === entrenamiento.id)
        ? actuales
        : [...actuales, actividad],
    );
    persist({ type: "save-activity", data: actividad });
  }

  function eliminarEntrenamiento(id: string) {
    workoutPersistence.clearTimer(id);
    workoutPersistence.clearSession(id);
    setWorkouts((actuales) => actuales.filter((item) => item.id !== id));
    setRegistros((actuales) => recordsWithoutSession(actuales, id));
    if (entrenamientoActivoId === id) setEntrenamientoActivoId(null);
    persist({ type: "delete-workout", entityId: id });
  }

  function eliminarActividad(actividad: CompletedActivity) {
    setActivityPendingDeletion(actividad);
  }

  function confirmarEliminarActividad() {
    if (!activityPendingDeletion) return;
    const actividad = activityPendingDeletion;
    setActivityPendingDeletion(null);
    setActivities((actuales) =>
      actuales.filter((item) => item.id !== actividad.id),
    );
    persist({ type: "delete-activity", entityId: actividad.id });

    if (actividad.type !== "external") return;

    setWorkouts((actuales) =>
      actuales.filter((item) => item.id !== actividad.scheduledWorkoutId),
    );
    setRegistros((actuales) =>
      recordsWithoutSession(actuales, actividad.scheduledWorkoutId),
    );
    if (entrenamientoActivoId === actividad.scheduledWorkoutId) {
      setEntrenamientoActivoId(null);
    }
    persist({ type: "delete-workout", entityId: actividad.scheduledWorkoutId });
  }

  function comenzarEntrenamiento(item: ScheduledWorkout) {
    if (item.origin !== "routine") return;
    const rutinaSeleccionada = routines.find(
      (rutinaActual) => rutinaActual.id === item.routineId,
    );
    if (!rutinaSeleccionada || !rutinaTieneEjercicios(rutinaSeleccionada))
      return;
    setRutinaId(item.routineId);
    actualizarEntrenamiento({ ...item, status: "in-progress" });
    setEntrenamientoActivoId(item.id);
  }

  function guardarComoPlantilla(rutina: Routine, title: string) {
    if (
      !usuario ||
      usuario.role !== "coach" ||
      !canCoachEditRoutine(rutina, usuario)
    ) {
      setSyncError("Solo podés crear plantillas desde rutinas propias.");
      return;
    }
    const id = idPlantilla(usuario.id);
    const plantilla = {
      id,
      coachId: usuario.id,
      title,
      objective: rutina.objective,
      durationMinutes: rutina.durationMinutes,
      structure: rutina.structure,
    };
    setTemplates((actuales) => [...actuales, plantilla]);
    persist({ type: "save-templates", data: [plantilla] });
  }

  function asignarPlantilla(plantillaId: string, athleteId: number) {
    const plantilla = templates.find(
      (item) => item.id === plantillaId && item.coachId === usuario?.id,
    );
    if (!plantilla) return;
    const rutinaNueva = rutinaDesdePlantilla(
      plantilla,
      athleteId,
      usuario?.id ?? plantilla.coachId,
    );
    setRoutines((actuales) => [...actuales, rutinaNueva]);
    persist({ type: "save-routines", data: [rutinaNueva] });
    seleccionarAtleta(athleteId);
    setRutinaId(rutinaNueva.id);
    setRegistros({});
  }

  function eliminarPlantilla(plantillaId: string) {
    setTemplates((actuales) =>
      actuales.filter(
        (plantilla) =>
          plantilla.id !== plantillaId || plantilla.coachId !== usuario?.id,
      ),
    );
    persist({ type: "delete-template", entityId: plantillaId });
  }

  async function crearAtleta(name: string, email: string) {
    if (!usuario || usuario.role !== "coach") {
      return "Solo un entrenador puede agregar atletas.";
    }
    if (!supabaseConfigured) {
      return "La base de datos no está configurada.";
    }
    const rutinaBase = nuevaRutinaBase(usuario.id);

    let id: number;
    try {
      id = await createAthleteWithRoutine({
        coachId: usuario.id,
        name,
        email,
        routine: rutinaBase,
      });
    } catch (error) {
      const mensaje = syncErrorMessage(error);
      setSyncError(mensaje);
      return mensaje;
    }

    const nuevoAtleta: User = { id, name, email, role: "athlete" };
    const rutinaInicial: Routine = { ...rutinaBase, athleteId: id };
    setUsers((actuales) => [
      ...actuales.map((item) =>
        item.id === usuario.id
          ? {
              ...item,
              athleteIds: [...new Set([...(item.athleteIds ?? []), id])],
            }
          : item,
      ),
      nuevoAtleta,
    ]);
    setRoutines((actuales) => [...actuales, rutinaInicial]);
    setAtletaSeleccionadoId(id);
    setRutinaId(rutinaInicial.id);
    setRegistros({});
    setSyncError(null);
    return null;
  }

  function eliminarRutina(id: string) {
    const rutinaAEliminar = routines.find((item) => item.id === id);
    const puedeEliminar =
      usuario &&
      rutinaAEliminar &&
      (usuario.role === "coach"
        ? canCoachEditRoutine(rutinaAEliminar, usuario)
        : rutinaAEliminar.athleteId === usuario.id &&
          rutinaAEliminar.createdById === usuario.id);
    if (!puedeEliminar || !rutinaAEliminar) {
      setSyncError("No tenés permiso para eliminar esta rutina.");
      return;
    }
    const restantes = rutinasDelAtleta.filter((item) => item.id !== id);
    const idsDeEntrenamientos = workouts
      .filter((item) => item.origin === "routine" && item.routineId === id)
      .map((item) => item.id);
    idsDeEntrenamientos.forEach((workoutId) => {
      workoutPersistence.clearTimer(workoutId);
      workoutPersistence.clearSession(workoutId);
    });
    setRoutines((actuales) => actuales.filter((item) => item.id !== id));
    setWorkouts((actuales) =>
      actuales.filter(
        (item) => item.origin !== "routine" || item.routineId !== id,
      ),
    );
    const siguienteRutina =
      restantes.find((item) => item.archivedAt === null) ?? restantes[0];
    setRutinaId(siguienteRutina?.id ?? "");
    if (
      entrenamientoActivoId &&
      idsDeEntrenamientos.includes(entrenamientoActivoId)
    ) {
      setEntrenamientoActivoId(null);
    }
    setRegistros((actuales) =>
      recordsWithoutSessions(actuales, idsDeEntrenamientos),
    );
    persist({ type: "delete-routine", entityId: id });
  }

  function duplicarRutinaPersonal(rutinaOrigen: Routine) {
    const rutinaPersistida = routines.find(
      (item) => item.id === rutinaOrigen.id,
    );
    if (
      !usuario ||
      usuario.role !== "athlete" ||
      !rutinaPersistida ||
      rutinaPersistida.athleteId !== usuario.id ||
      rutinaPersistida.createdById === usuario.id ||
      rutinaPersistida.archivedAt !== null
    ) {
      setSyncError("No tenés permiso para duplicar esta rutina.");
      return null;
    }
    const copia = duplicateRoutineForAthlete(rutinaPersistida, usuario.id);
    setRoutines((actuales) => [...actuales, copia]);
    setRutinaId(copia.id);
    persist({ type: "save-routines", data: [copia] });
    return copia;
  }

  function archivarRutina(rutinaAArchivar: Routine) {
    const rutinaPersistida = routines.find(
      (item) => item.id === rutinaAArchivar.id,
    );
    if (
      !usuario ||
      usuario.role !== "athlete" ||
      !rutinaPersistida ||
      rutinaPersistida.athleteId !== usuario.id
    ) {
      setSyncError("No tenés permiso para archivar esta rutina.");
      return;
    }
    const actualizada = {
      ...rutinaPersistida,
      sharedWithCoachId: null,
      archivedAt: new Date().toISOString(),
    };
    setRoutines((actuales) =>
      actuales.map((item) =>
        item.id === actualizada.id ? actualizada : item,
      ),
    );
    const siguiente = todasLasRutinasDelAtleta.find(
      (item) => item.id !== actualizada.id && item.archivedAt === null,
    );
    if (siguiente) setRutinaId(siguiente.id);
    persist({ type: "save-routines", data: [actualizada] });
  }

  function restaurarRutina(rutinaArchivada: Routine) {
    const rutinaPersistida = routines.find(
      (item) => item.id === rutinaArchivada.id,
    );
    if (
      !usuario ||
      usuario.role !== "athlete" ||
      !rutinaPersistida ||
      rutinaPersistida.athleteId !== usuario.id ||
      rutinaPersistida.archivedAt === null
    ) {
      setSyncError("No tenés permiso para restaurar esta rutina.");
      return;
    }
    const actualizada = { ...rutinaPersistida, archivedAt: null };
    setRoutines((actuales) =>
      actuales.map((item) =>
        item.id === actualizada.id ? actualizada : item,
      ),
    );
    setRutinaId(actualizada.id);
    persist({ type: "save-routines", data: [actualizada] });
  }

  function salir() {
    clearUserSession();
    setUserId(null);
    setVistaPrevia(false);
    setRegistros({});
    setEntrenamientoActivoId(null);
    replaceNavigate("/");
  }

  function intentarSalir() {
    if (editorDirty) {
      setLogoutConfirmationOpen(true);
      return;
    }
    salir();
  }

  if (!hydrated) {
    return <div className="min-h-dvh bg-app" />;
  }

  if (!usuario) {
    return <LandingAcceso onAccess={acceder} />;
  }

  if (!atleta) {
    return <LandingAcceso onAccess={acceder} />;
  }

  const mostrandoAtleta = usuario.role === "athlete" || vistaPrevia;

  return (
    <>
      <AppShell
        usuario={usuario}
        vistaPrevia={vistaPrevia}
        workoutImmersive={workoutImmersive}
        vistaEntrenador={vistaEntrenador}
        vistaAtleta={vistaAtleta}
        syncError={syncError}
        onClosePreview={() => setVistaPrevia(false)}
        onLogout={intentarSalir}
        navigate={navigate}
      >
        {(!mostrandoAtleta && vistaEntrenador === "profile") ||
        (mostrandoAtleta && vistaAtleta === "profile" && !entrenamientoActivo) ? (
          <PerfilUsuario
            usuario={usuario}
            entrenadorAsignado={
              usuario.role === "athlete" ? entrenadorDelAtleta : undefined
            }
          />
        ) : !mostrandoAtleta ? (
          <HomeEntrenador
          key={`${atleta.id}-${rutina?.id ?? "sin-rutina"}`}
          entrenador={usuario}
          users={users}
          atletas={atletasDelCoach}
          atleta={atleta}
          routines={rutinasDelAtleta}
          rutinasPorAtleta={visibleRoutinesForCoach(routines, usuario)}
          workouts={workouts.filter((item) => item.athleteId === atleta.id)}
          activities={activities.filter((item) => item.athleteId === atleta.id)}
          templates={templates.filter(
            (plantilla) => plantilla.coachId === usuario.id,
          )}
          vista={vistaEntrenador}
          detalleAtleta={detalleAtleta}
          rutina={rutina}
          onSelectAtleta={seleccionarAtleta}
          onSelect={setRutinaId}
          onSaveRutina={guardarRutina}
          onCreateRutina={crearRutina}
          onSaveAsTemplate={guardarComoPlantilla}
          onAssignTemplate={asignarPlantilla}
          onDeleteTemplate={eliminarPlantilla}
          onCreateAtleta={crearAtleta}
          onDeleteRutina={eliminarRutina}
          onCreateEntrenamiento={crearEntrenamientos}
          onUpdateEntrenamiento={actualizarEntrenamiento}
          onDeleteEntrenamiento={eliminarEntrenamiento}
          onDirtyChange={setEditorDirty}
          verComoAtleta={() => setVistaPrevia(true)}
          navigate={navigate}
        />
      ) : vistaAtleta === "agenda" && !entrenamientoActivo ? (
        <SportsSchedule
          atleta={atleta}
          usuarioActual={usuario}
          routines={rutinasDelAtleta}
          workouts={workouts.filter((item) => item.athleteId === atleta.id)}
          modoCoach={usuario.role === "coach"}
          onCreate={crearEntrenamientos}
          onUpdate={actualizarEntrenamiento}
          onDelete={eliminarEntrenamiento}
          onStart={comenzarEntrenamiento}
        />
      ) : vistaAtleta === "activities" && !entrenamientoActivo ? (
        <ActivityHistory
          activities={activities.filter((item) => item.athleteId === atleta.id)}
          onDeleteActivity={eliminarActividad}
          canDeleteExternalActivities={usuario.role !== "coach"}
        />
      ) : vistaAtleta === "inicio" && !entrenamientoActivo ? (
        <HomeHoy
          atleta={atleta}
          viewer={usuario}
          users={users}
          routines={rutinasDelAtleta}
          workouts={workouts.filter((item) => item.athleteId === atleta.id)}
          onStart={comenzarEntrenamiento}
          onUpdate={actualizarEntrenamiento}
          navigate={navigate}
        />
      ) : (
        <ExperienciaAtleta
          key={`${atleta.id}-${entrenamientoActivo?.id ?? "routines"}`}
          atleta={atleta}
          viewer={usuario}
          users={users}
          coach={entrenadorDelAtleta}
          routines={rutinasDelAtleta}
          rutina={rutinaDeEntrenamiento}
          entrenamientoInicial={entrenamientoActivo}
          entrenamientoPausado={entrenamientoPausado}
          onSelect={setRutinaId}
          onCreateEntrenamiento={crearEntrenamiento}
          onUpdateEntrenamiento={actualizarEntrenamiento}
          onCompleteRoutine={registrarActividadRutina}
          onSaveRoutine={guardarRutina}
          onCreateRoutine={crearRutina}
          onDuplicateRoutine={duplicarRutinaPersonal}
          onArchiveRoutine={archivarRutina}
          onRestoreRoutine={restaurarRutina}
          onDeleteRoutine={eliminarRutina}
          onCancelWorkout={eliminarEntrenamiento}
          onCloseScheduled={() => setEntrenamientoActivoId(null)}
          onWorkoutModeChange={setWorkoutImmersive}
          onDirtyChange={setEditorDirty}
          registros={registros}
          setRegistros={setRegistros}
          />
        )}
      </AppShell>
      <ConfirmationDialog
        open={logoutConfirmationOpen}
        title="Tenés cambios sin guardar"
        description="Si cerrás sesión ahora, se descartarán los cambios de esta edición."
        confirmLabel="Descartar y cerrar sesión"
        cancelLabel="Seguir editando"
        destructive
        onCancel={() => setLogoutConfirmationOpen(false)}
        onConfirm={() => {
          setLogoutConfirmationOpen(false);
          salir();
        }}
      />
      <ConfirmationDialog
        open={activityPendingDeletion !== null}
        title={
          activityPendingDeletion
            ? `¿Eliminar “${activityPendingDeletion.title}”?`
            : "¿Eliminar actividad?"
        }
        description={
          activityPendingDeletion?.type === "external"
            ? "También la vamos a quitar de la agenda para que no quede como actividad completada."
            : "La actividad se eliminará del historial."
        }
        confirmLabel="Eliminar actividad"
        destructive
        onCancel={() => setActivityPendingDeletion(null)}
        onConfirm={confirmarEliminarActividad}
      />
    </>
  );
}
