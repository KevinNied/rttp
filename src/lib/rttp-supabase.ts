import {
  CompletedActivity,
  ActivitySet,
  RoutineActivitySnapshot,
} from "@/lib/rttp-activity";
import {
  ActivityCategory,
  ScheduledWorkout,
  WorkoutStatus,
} from "@/lib/rttp-agenda";
import { Routine, RoutineStructure, Role, User } from "@/lib/rttp-data";
import { getSupabaseClient } from "@/lib/supabase";

export type PersistedTemplate = Omit<
  Routine,
  "athleteId" | "createdById" | "sharedWithCoachId" | "archivedAt"
> & {
  coachId: number;
};

export type PersistedData = {
  users: User[];
  routines: Routine[];
  templates: PersistedTemplate[];
  workouts: ScheduledWorkout[];
  activities: CompletedActivity[];
};

export type NewSupabaseMutation =
  | { type: "save-routines"; data: Routine[] }
  | { type: "delete-routine"; entityId: string }
  | {
      type: "save-templates";
      data: PersistedTemplate[];
    }
  | { type: "delete-template"; entityId: string }
  | {
      type: "save-workouts";
      data: ScheduledWorkout[];
    }
  | { type: "delete-workout"; entityId: string }
  | { type: "save-activity"; data: CompletedActivity }
  | { type: "delete-activity"; entityId: string };

export type SupabaseMutation = NewSupabaseMutation & { id: string };
export type UserIdMapping = Record<string, number>;

type ProfileRow = {
  id: number;
  name: string;
  email: string;
  role: Role;
  athlete_ids: number[];
};

type RoutineRow = {
  id: string;
  athlete_id: number;
  created_by_id?: number | null;
  shared_with_coach_id?: number | null;
  archived_at?: string | null;
  title: string;
  objective: string;
  duration_minutes: number | null;
  structure: RoutineStructure;
};

type TemplateRow = {
  id: string;
  coach_id: number;
  title: string;
  objective: string;
  duration_minutes: number | null;
  structure: RoutineStructure;
};

type ScheduledWorkoutRow = {
  id: string;
  athlete_id: number;
  workout_date: string;
  workout_time: string | null;
  duration_minutes: number | null;
  status: WorkoutStatus;
  created_by_id: number;
  notes: string;
  origin: "routine" | "external";
  routine_id: string | null;
  title: string | null;
  category: ActivityCategory | null;
  created_at: string;
  updated_at: string;
};

type ActivityRow = {
  id: string;
  athlete_id: number;
  scheduled_workout_id: string;
  activity_type: "routine" | "external";
  title: string;
  category: ActivityCategory | null;
  routine_id: string | null;
  routine_snapshot: RoutineActivitySnapshot | null;
  activity_date: string;
  completed_at: string;
  duration_minutes: number | null;
  duration_seconds?: number | null;
  effort: number | null;
  feedback: string;
  notes: string;
  registered_by_id: number;
};

type ActivitySetRow = {
  activity_id: string;
  step_id: string;
  exercise_id: string;
  exercise_name: string;
  section_id: string;
  section_name: string;
  iteration_number: number;
  weight: number;
  repetitions: number;
  skipped: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertRoutineStructure(value: unknown, context: string) {
  if (
    !isRecord(value) ||
    !Array.isArray(value.sections) ||
    value.sections.some(
      (section) =>
        !isRecord(section) ||
        !["sequential", "rounds"].includes(String(section.kind)) ||
        !Array.isArray(section.exercises),
    )
  ) {
    throw new Error(
      `${context}: aplicá la migración de secciones de rutina en Supabase.`,
    );
  }
}

function assertQuery(context: string, error: { message: string } | null) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function routineCreatorId(row: RoutineRow, profiles: ProfileRow[]) {
  if (row.id === "r1" && row.athlete_id === 6) return 6;
  if (row.created_by_id !== null && row.created_by_id !== undefined) {
    return row.created_by_id;
  }
  const structure: unknown = row.structure;
  if (isRecord(structure) && typeof structure.createdById === "number") {
    return structure.createdById;
  }

  const coachIds = profiles
    .filter(
      (profile) =>
        profile.role === "coach" &&
        profile.athlete_ids.includes(row.athlete_id),
    )
    .map((profile) => profile.id);
  if (coachIds.length === 1) return coachIds[0];
  if (coachIds.length === 1) return coachIds[0];

  throw new Error(
    `Rutina ${row.id} sin autor inequívoco: aplicá la migración de autoría en Supabase.`,
  );
}

function routineSharedCoachId(row: RoutineRow) {
  if (row.shared_with_coach_id !== undefined) {
    return row.shared_with_coach_id;
  }
  const structure: unknown = row.structure;
  if (isRecord(structure) && typeof structure.sharedWithCoachId === "number") {
    return structure.sharedWithCoachId;
  }
  return null;
}

function routineArchivedAt(row: RoutineRow) {
  if (row.archived_at !== undefined) return row.archived_at;
  const structure: unknown = row.structure;
  if (isRecord(structure) && typeof structure.archivedAt === "string") {
    return structure.archivedAt;
  }
  return null;
}

function normalizedRoutineSnapshot(
  snapshot: RoutineActivitySnapshot,
  routineId: string | null,
  routines: RoutineRow[],
  profiles: ProfileRow[],
): RoutineActivitySnapshot {
  const snapshotData: unknown = snapshot;
  const source = routines.find((routine) => routine.id === routineId);
  const createdById =
    isRecord(snapshotData) && typeof snapshotData.createdById === "number"
      ? snapshotData.createdById
      : source
        ? routineCreatorId(source, profiles)
        : null;
  if (createdById === null) {
    throw new Error(
      `Snapshot de ${routineId ?? "rutina eliminada"} sin autor inequívoco.`,
    );
  }

  return {
    ...snapshot,
    createdById,
    sharedWithCoachId:
      isRecord(snapshotData) &&
      typeof snapshotData.sharedWithCoachId === "number"
        ? snapshotData.sharedWithCoachId
        : null,
    archivedAt:
      isRecord(snapshotData) && typeof snapshotData.archivedAt === "string"
        ? snapshotData.archivedAt
        : null,
  };
}

function routineRow(routine: Routine) {
  return {
    id: routine.id,
    athlete_id: routine.athleteId,
    created_by_id: routine.createdById,
    shared_with_coach_id: routine.sharedWithCoachId,
    archived_at: routine.archivedAt,
    title: routine.title,
    objective: routine.objective,
    duration_minutes: routine.durationMinutes,
    structure: routine.structure,
  };
}

function legacyRoutineRow(routine: Routine) {
  return {
    id: routine.id,
    athlete_id: routine.athleteId,
    title: routine.title,
    objective: routine.objective,
    duration_minutes: routine.durationMinutes,
    structure: {
      ...routine.structure,
      createdById: routine.createdById,
      sharedWithCoachId: routine.sharedWithCoachId,
      archivedAt: routine.archivedAt,
    },
  };
}

function isMissingRoutineOwnershipColumns(error: {
  code?: string;
  message: string;
}) {
  return (
    error.code === "PGRST204" &&
    ["created_by_id", "shared_with_coach_id", "archived_at"].some((column) =>
      error.message.includes(column),
    )
  );
}

async function upsertRoutines(
  routines: Routine[],
  options?: { onConflict: string; ignoreDuplicates: boolean },
) {
  const query = getSupabaseClient()
    .from("routines")
    .upsert(routines.map(routineRow), options);
  const { error } = await query;
  if (!error) return;
  if (!isMissingRoutineOwnershipColumns(error)) {
    assertQuery("No se pudieron guardar las rutinas", error);
    return;
  }

  const { error: legacyError } = await getSupabaseClient()
    .from("routines")
    .upsert(routines.map(legacyRoutineRow), options);
  assertQuery("No se pudieron guardar las rutinas", legacyError);
}

async function loadTable<T>(table: string, orderColumns: string[]) {
  const limit = 1000;
  const rows: T[] = [];

  for (let from = 0; ; from += limit) {
    let query = getSupabaseClient().from(table).select("*");
    for (const column of orderColumns) {
      query = query.order(column);
    }
    const { data, error } = await query.range(from, from + limit - 1);
    assertQuery(`No se pudo cargar ${table}`, error);
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < limit) return rows;
  }
}

export async function loadSupabaseData(): Promise<PersistedData> {
  const [profiles, routines, templates, workouts, activities, activitySets] =
    await Promise.all([
      loadTable<ProfileRow>("profiles", ["id"]),
      loadTable<RoutineRow>("routines", ["id"]),
      loadTable<TemplateRow>("routine_templates", ["id"]),
      loadTable<ScheduledWorkoutRow>("scheduled_workouts", ["id"]),
      loadTable<ActivityRow>("workout_activities", ["id"]),
      loadTable<ActivitySetRow>("workout_activity_sets", [
        "activity_id",
        "step_id",
      ]),
    ]);

  const sets = activitySets;
  routines.forEach((row) =>
    assertRoutineStructure(row.structure, `Rutina ${row.id} incompatible`),
  );
  templates.forEach((row) =>
    assertRoutineStructure(row.structure, `Plantilla ${row.id} incompatible`),
  );
  activities.forEach((row) => {
    if (row.routine_snapshot) {
      assertRoutineStructure(
        row.routine_snapshot.structure,
        `Snapshot ${row.id} incompatible`,
      );
    }
  });
  if (
    sets.some(
      (set) =>
        typeof set.section_id !== "string" ||
        typeof set.section_name !== "string" ||
        !Number.isInteger(set.iteration_number) ||
        set.iteration_number < 1,
    )
  ) {
    throw new Error(
      "El historial es incompatible: aplicá la migración de secciones de rutina en Supabase.",
    );
  }

  return {
    users: profiles.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      ...(row.role === "coach" ? { athleteIds: row.athlete_ids } : {}),
    })),
    routines: routines.map((row) => ({
      id: row.id,
      athleteId: row.athlete_id,
      createdById: routineCreatorId(row, profiles),
      sharedWithCoachId: routineSharedCoachId(row),
      archivedAt: routineArchivedAt(row),
      title: row.title,
      objective: row.objective,
      durationMinutes: row.duration_minutes,
      structure: { sections: row.structure.sections },
    })),
    templates: templates.map((row) => ({
      id: row.id,
      coachId: row.coach_id,
      title: row.title,
      objective: row.objective,
      durationMinutes: row.duration_minutes,
      structure: row.structure,
    })),
    workouts: workouts.map((row): ScheduledWorkout =>
      row.origin === "routine"
        ? {
            id: row.id,
            athleteId: row.athlete_id,
            date: row.workout_date,
            time: row.workout_time?.slice(0, 5) ?? null,
            durationMinutes: row.duration_minutes,
            status: row.status,
            createdById: row.created_by_id,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            origin: "routine",
            routineId: row.routine_id ?? "",
            title: null,
            category: null,
          }
        : {
            id: row.id,
            athleteId: row.athlete_id,
            date: row.workout_date,
            time: row.workout_time?.slice(0, 5) ?? null,
            durationMinutes: row.duration_minutes,
            status: row.status,
            createdById: row.created_by_id,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            origin: "external",
            routineId: null,
            title: row.title ?? "Actividad",
            category: row.category ?? "other",
          },
    ),
    activities: activities.map((row) => ({
      id: row.id,
      athleteId: row.athlete_id,
      scheduledWorkoutId: row.scheduled_workout_id,
      type: row.activity_type,
      title: row.title,
      category: row.category,
      routineId: row.routine_id,
      routineSnapshot: row.routine_snapshot
        ? normalizedRoutineSnapshot(
            row.routine_snapshot,
            row.routine_id,
            routines,
            profiles,
          )
        : null,
      date: row.activity_date,
      completedAt: row.completed_at,
      durationMinutes: row.duration_minutes,
      durationSeconds:
        row.duration_seconds ?? row.routine_snapshot?.durationSeconds ?? null,
      effort: row.effort,
      feedback: row.feedback,
      notes: row.notes,
      recordedById: row.registered_by_id,
      sets: sets
        .filter((set) => set.activity_id === row.id)
        .map((set): ActivitySet => ({
          stepId: set.step_id,
          exerciseId: set.exercise_id,
          exerciseName: set.exercise_name,
          sectionId: set.section_id,
          sectionName: set.section_name,
          iteration: set.iteration_number,
          weight: Number(set.weight),
          reps: set.repetitions,
          skipped: set.skipped,
        })),
    })),
  };
}

export async function saveUsers(users: User[]) {
  if (users.length === 0) return;
  const { error } = await getSupabaseClient()
    .from("profiles")
    .upsert(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        athlete_ids: user.athleteIds ?? [],
      })),
    );
  assertQuery("No se pudieron guardar los perfiles", error);
}

export async function createAthleteWithRoutine({
  coachId,
  name,
  email,
  routine,
}: {
  coachId: number;
  name: string;
  email: string;
  routine: Omit<Routine, "athleteId">;
}) {
  const { data, error } = await getSupabaseClient().rpc(
    "create_athlete_with_routine",
    {
      p_coach_id: coachId,
      p_athlete_name: name,
      p_athlete_email: email,
      p_initial_routine: routine,
    },
  );
  assertQuery("No se pudo crear el atleta", error);
  if (typeof data !== "number") {
    throw new Error("Supabase no devolvió el identificador del nuevo atleta.");
  }
  return data;
}

export async function saveRoutines(routines: Routine[]) {
  if (routines.length === 0) return;
  await upsertRoutines(routines);
}

export async function deleteRoutineFromSupabase(id: string) {
  const { error } = await getSupabaseClient()
    .from("routines")
    .delete()
    .eq("id", id);
  assertQuery("No se pudo eliminar la rutina", error);
}

export async function saveTemplates(templates: PersistedTemplate[]) {
  if (templates.length === 0) return;
  const { error } = await getSupabaseClient()
    .from("routine_templates")
    .upsert(
      templates.map((template) => ({
        id: template.id,
        coach_id: template.coachId,
        title: template.title,
        objective: template.objective,
        duration_minutes: template.durationMinutes,
        structure: template.structure,
      })),
    );
  assertQuery("No se pudieron guardar las plantillas", error);
}

export async function deleteTemplateFromSupabase(id: string) {
  const { error } = await getSupabaseClient()
    .from("routine_templates")
    .delete()
    .eq("id", id);
  assertQuery("No se pudo eliminar la plantilla", error);
}

export async function saveScheduledWorkouts(workouts: ScheduledWorkout[]) {
  if (workouts.length === 0) return;
  const { error } = await getSupabaseClient()
    .from("scheduled_workouts")
    .upsert(
      workouts.map((item) => ({
        id: item.id,
        athlete_id: item.athleteId,
        workout_date: item.date,
        workout_time: item.time,
        duration_minutes: item.durationMinutes,
        status: item.status,
        created_by_id: item.createdById,
        notes: item.notes,
        origin: item.origin,
        routine_id: item.routineId,
        title: item.title,
        category: item.category,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      })),
    );
  assertQuery("No se pudo guardar la agenda", error);
}

export async function deleteScheduledWorkoutFromSupabase(id: string) {
  const { error } = await getSupabaseClient()
    .from("scheduled_workouts")
    .delete()
    .eq("id", id);
  assertQuery("No se pudo eliminar el entrenamiento", error);
}

export async function saveActivity(activityData: CompletedActivity) {
  const { error } = await getSupabaseClient().rpc("save_workout_activity", {
    activity: activityData,
    activity_sets: activityData.sets,
  });
  assertQuery("No se pudo guardar la actividad", error);
}

export async function deleteActivityFromSupabase(id: string) {
  const { error: setsError } = await getSupabaseClient()
    .from("workout_activity_sets")
    .delete()
    .eq("activity_id", id);
  assertQuery("No se pudieron eliminar las series de la actividad", setsError);

  const { error } = await getSupabaseClient()
    .from("workout_activities")
    .delete()
    .eq("id", id);
  assertQuery("No se pudo eliminar la actividad", error);
}

function remapId(id: number, mapping: UserIdMapping) {
  return mapping[String(id)] ?? id;
}

function remapRoutine(routine: Routine, mapping: UserIdMapping): Routine {
  return {
    ...routine,
    athleteId: remapId(routine.athleteId, mapping),
    createdById: remapId(routine.createdById, mapping),
    sharedWithCoachId:
      routine.sharedWithCoachId === null
        ? null
        : remapId(routine.sharedWithCoachId, mapping),
  };
}

function remapScheduledWorkout(
  workout: ScheduledWorkout,
  mapping: UserIdMapping,
): ScheduledWorkout {
  return {
    ...workout,
    athleteId: remapId(workout.athleteId, mapping),
    createdById: remapId(workout.createdById, mapping),
  };
}

function remapActivity(
  activityData: CompletedActivity,
  mapping: UserIdMapping,
): CompletedActivity {
  return {
    ...activityData,
    athleteId: remapId(activityData.athleteId, mapping),
    recordedById: remapId(activityData.recordedById, mapping),
    routineSnapshot: activityData.routineSnapshot
      ? remapRoutine(activityData.routineSnapshot, mapping)
      : null,
  };
}

export function remapSupabaseMutation(
  mutation: SupabaseMutation,
  mapping: UserIdMapping,
): SupabaseMutation {
  switch (mutation.type) {
    case "save-routines":
      return {
        ...mutation,
        data: mutation.data.map((routine) => remapRoutine(routine, mapping)),
      };
    case "save-templates":
      return {
        ...mutation,
        data: mutation.data.map((template) => ({
          ...template,
          coachId: remapId(template.coachId, mapping),
        })),
      };
    case "save-workouts":
      return {
        ...mutation,
        data: mutation.data.map((workout) =>
          remapScheduledWorkout(workout, mapping),
        ),
      };
    case "save-activity":
      return {
        ...mutation,
        data: remapActivity(mutation.data, mapping),
      };
    default:
      return mutation;
  }
}

export async function executeSupabaseMutation(mutation: SupabaseMutation) {
  switch (mutation.type) {
    case "save-routines":
      return saveRoutines(mutation.data);
    case "delete-routine":
      return deleteRoutineFromSupabase(mutation.entityId);
    case "save-templates":
      return saveTemplates(mutation.data);
    case "delete-template":
      return deleteTemplateFromSupabase(mutation.entityId);
    case "save-workouts":
      return saveScheduledWorkouts(mutation.data);
    case "delete-workout":
      return deleteScheduledWorkoutFromSupabase(mutation.entityId);
    case "save-activity":
      return saveActivity(mutation.data);
    case "delete-activity":
      return deleteActivityFromSupabase(mutation.entityId);
  }
}

async function migrateProfiles(users: User[]) {
  const { data, error } = await getSupabaseClient().rpc("migrate_profiles", {
    local_profiles: users,
  });
  assertQuery("No se pudieron migrar los perfiles", error);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Supabase no devolvió el mapeo de perfiles migrados.");
  }
  return Object.fromEntries(
    Object.entries(data).map(([id, destination]) => [id, Number(destination)]),
  ) as UserIdMapping;
}

async function insertMissingRoutines(routines: Routine[]) {
  if (routines.length === 0) return;
  await upsertRoutines(routines, {
    onConflict: "id",
    ignoreDuplicates: true,
  });
}

async function insertMissingTemplates(templates: PersistedTemplate[]) {
  if (templates.length === 0) return;
  const { error } = await getSupabaseClient()
    .from("routine_templates")
    .upsert(
      templates.map((template) => ({
        id: template.id,
        coach_id: template.coachId,
        title: template.title,
        objective: template.objective,
        duration_minutes: template.durationMinutes,
        structure: template.structure,
      })),
      { onConflict: "id", ignoreDuplicates: true },
    );
  assertQuery("No se pudieron migrar las plantillas", error);
}

async function insertMissingWorkouts(workouts: ScheduledWorkout[]) {
  if (workouts.length === 0) return;
  const { error } = await getSupabaseClient()
    .from("scheduled_workouts")
    .upsert(
      workouts.map((item) => ({
        id: item.id,
        athlete_id: item.athleteId,
        workout_date: item.date,
        workout_time: item.time,
        duration_minutes: item.durationMinutes,
        status: item.status,
        created_by_id: item.createdById,
        notes: item.notes,
        origin: item.origin,
        routine_id: item.routineId,
        title: item.title,
        category: item.category,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      })),
      { onConflict: "id", ignoreDuplicates: true },
    );
  assertQuery("No se pudo migrar la agenda", error);
}

async function insertMissingActivity(activityData: CompletedActivity) {
  const { error } = await getSupabaseClient().rpc("migrate_workout_activity", {
    activity: activityData,
    activity_sets: activityData.sets,
  });
  assertQuery("No se pudo migrar la actividad", error);
}

export async function migrateMissingData(localData: PersistedData) {
  const mapping = await migrateProfiles(localData.users);
  const routines = localData.routines.map((routine) =>
    remapRoutine(routine, mapping),
  );
  const templates = localData.templates.map((template) => ({
    ...template,
    coachId: remapId(template.coachId, mapping),
  }));
  const workouts = localData.workouts.map((workout) =>
    remapScheduledWorkout(workout, mapping),
  );
  const activities = localData.activities.map((activityData) =>
    remapActivity(activityData, mapping),
  );

  await insertMissingRoutines(routines);
  await insertMissingTemplates(templates);
  await insertMissingWorkouts(workouts);
  await Promise.all(activities.map(insertMissingActivity));
  return mapping;
}
