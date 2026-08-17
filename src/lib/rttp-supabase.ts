import { ActividadRealizada, SerieActividad } from "@/lib/rttp-activity";
import {
  CategoriaActividad,
  EntrenamientoProgramado,
  EstadoEntrenamiento,
} from "@/lib/rttp-agenda";
import { Bloque, Rutina, Rol, Usuario } from "@/lib/rttp-data";
import { getSupabaseClient } from "@/lib/supabase";

export type PlantillaPersistida = Omit<Rutina, "atletaId"> & {
  entrenadorId: number;
};

export type DatosPersistidos = {
  usuarios: Usuario[];
  rutinas: Rutina[];
  plantillas: PlantillaPersistida[];
  entrenamientos: EntrenamientoProgramado[];
  actividades: ActividadRealizada[];
};

export type NuevaMutacionSupabase =
  | { tipo: "guardar-rutinas"; datos: Rutina[] }
  | { tipo: "eliminar-rutina"; entidadId: string }
  | {
      tipo: "guardar-plantillas";
      datos: PlantillaPersistida[];
    }
  | { tipo: "eliminar-plantilla"; entidadId: string }
  | {
      tipo: "guardar-entrenamientos";
      datos: EntrenamientoProgramado[];
    }
  | { tipo: "eliminar-entrenamiento"; entidadId: string }
  | { tipo: "guardar-actividad"; datos: ActividadRealizada };

export type MutacionSupabase = NuevaMutacionSupabase & { id: string };
export type MapeoUsuarios = Record<string, number>;

type ProfileRow = {
  id: number;
  name: string;
  email: string;
  role: Rol;
  athlete_ids: number[];
};

type RoutineRow = {
  id: string;
  athlete_id: number;
  title: string;
  objective: string;
  duration_minutes: number;
  blocks: Bloque[];
};

type TemplateRow = {
  id: string;
  coach_id: number;
  title: string;
  objective: string;
  duration_minutes: number;
  blocks: Bloque[];
};

type ScheduledWorkoutRow = {
  id: string;
  athlete_id: number;
  workout_date: string;
  workout_time: string | null;
  duration_minutes: number;
  status: EstadoEntrenamiento;
  created_by_id: number;
  notes: string;
  origin: "rutina" | "externo";
  routine_id: string | null;
  title: string | null;
  category: CategoriaActividad | null;
  created_at: string;
  updated_at: string;
};

type ActivityRow = {
  id: string;
  athlete_id: number;
  scheduled_workout_id: string;
  activity_type: "rutina" | "externa";
  title: string;
  category: CategoriaActividad | null;
  routine_id: string | null;
  routine_snapshot: Rutina | null;
  activity_date: string;
  completed_at: string;
  duration_minutes: number;
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
  block_id: string;
  block_name: string;
  round_number: number;
  weight: number;
  repetitions: number;
  skipped: boolean;
};

function assertQuery(
  context: string,
  error: { message: string } | null,
) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

async function cargarTabla<T>(tabla: string, columnasOrden: string[]) {
  const limite = 1000;
  const filas: T[] = [];

  for (let desde = 0; ; desde += limite) {
    let consulta = getSupabaseClient()
      .from(tabla)
      .select("*");
    for (const columna of columnasOrden) {
      consulta = consulta.order(columna);
    }
    const { data, error } = await consulta.range(
      desde,
      desde + limite - 1,
    );
    assertQuery(`No se pudo cargar ${tabla}`, error);
    const pagina = (data ?? []) as T[];
    filas.push(...pagina);
    if (pagina.length < limite) return filas;
  }
}

export async function cargarDatosSupabase(): Promise<DatosPersistidos> {
  const [profiles, routines, templates, workouts, activities, activitySets] =
    await Promise.all([
      cargarTabla<ProfileRow>("profiles", ["id"]),
      cargarTabla<RoutineRow>("routines", ["id"]),
      cargarTabla<TemplateRow>("routine_templates", ["id"]),
      cargarTabla<ScheduledWorkoutRow>("scheduled_workouts", ["id"]),
      cargarTabla<ActivityRow>("workout_activities", ["id"]),
      cargarTabla<ActivitySetRow>("workout_activity_sets", [
        "activity_id",
        "step_id",
      ]),
    ]);

  const sets = activitySets;

  return {
    usuarios: profiles.map((row) => ({
      id: row.id,
      nombre: row.name,
      email: row.email,
      rol: row.role,
      ...(row.role === "entrenador"
        ? { atletaIds: row.athlete_ids }
        : {}),
    })),
    rutinas: routines.map((row) => ({
      id: row.id,
      atletaId: row.athlete_id,
      titulo: row.title,
      objetivo: row.objective,
      duracion: row.duration_minutes,
      bloques: row.blocks,
    })),
    plantillas: templates.map((row) => ({
      id: row.id,
      entrenadorId: row.coach_id,
      titulo: row.title,
      objetivo: row.objective,
      duracion: row.duration_minutes,
      bloques: row.blocks,
    })),
    entrenamientos: workouts.map(
      (row): EntrenamientoProgramado =>
        row.origin === "rutina"
          ? {
              id: row.id,
              atletaId: row.athlete_id,
              fecha: row.workout_date,
              hora: row.workout_time?.slice(0, 5) ?? null,
              duracionMinutos: row.duration_minutes,
              estado: row.status,
              creadoPorId: row.created_by_id,
              notas: row.notes,
              creadoEn: row.created_at,
              actualizadoEn: row.updated_at,
              origen: "rutina",
              rutinaId: row.routine_id ?? "",
              titulo: null,
              categoria: null,
            }
          : {
              id: row.id,
              atletaId: row.athlete_id,
              fecha: row.workout_date,
              hora: row.workout_time?.slice(0, 5) ?? null,
              duracionMinutos: row.duration_minutes,
              estado: row.status,
              creadoPorId: row.created_by_id,
              notas: row.notes,
              creadoEn: row.created_at,
              actualizadoEn: row.updated_at,
              origen: "externo",
              rutinaId: null,
              titulo: row.title ?? "Actividad",
              categoria: row.category ?? "otra",
            },
    ),
    actividades: activities.map((row) => ({
      id: row.id,
      atletaId: row.athlete_id,
      entrenamientoProgramadoId: row.scheduled_workout_id,
      tipo: row.activity_type,
      titulo: row.title,
      categoria: row.category,
      rutinaId: row.routine_id,
      rutinaSnapshot: row.routine_snapshot,
      fecha: row.activity_date,
      completadaEn: row.completed_at,
      duracionMinutos: row.duration_minutes,
      esfuerzo: row.effort,
      feedback: row.feedback,
      notas: row.notes,
      registradaPorId: row.registered_by_id,
      series: sets
        .filter((set) => set.activity_id === row.id)
        .map(
          (set): SerieActividad => ({
            pasoId: set.step_id,
            ejercicioId: set.exercise_id,
            ejercicioNombre: set.exercise_name,
            bloqueId: set.block_id,
            bloqueNombre: set.block_name,
            ronda: set.round_number,
            peso: Number(set.weight),
            repeticiones: set.repetitions,
            omitida: set.skipped,
          }),
        ),
    })),
  };
}

export async function guardarUsuarios(usuarios: Usuario[]) {
  if (usuarios.length === 0) return;
  const { error } = await getSupabaseClient()
    .from("profiles")
    .upsert(
      usuarios.map((usuario) => ({
        id: usuario.id,
        name: usuario.nombre,
        email: usuario.email,
        role: usuario.rol,
        athlete_ids: usuario.atletaIds ?? [],
      })),
    );
  assertQuery("No se pudieron guardar los perfiles", error);
}

export async function crearAtletaConRutina({
  entrenadorId,
  nombre,
  email,
  rutina,
}: {
  entrenadorId: number;
  nombre: string;
  email: string;
  rutina: Omit<Rutina, "atletaId">;
}) {
  const { data, error } = await getSupabaseClient().rpc(
    "create_athlete_with_routine",
    {
      p_coach_id: entrenadorId,
      p_athlete_name: nombre,
      p_athlete_email: email,
      p_initial_routine: rutina,
    },
  );
  assertQuery("No se pudo crear el atleta", error);
  if (typeof data !== "number") {
    throw new Error("Supabase no devolvió el identificador del nuevo atleta.");
  }
  return data;
}

export async function guardarRutinas(rutinas: Rutina[]) {
  if (rutinas.length === 0) return;
  const { error } = await getSupabaseClient()
    .from("routines")
    .upsert(
      rutinas.map((rutina) => ({
        id: rutina.id,
        athlete_id: rutina.atletaId,
        title: rutina.titulo,
        objective: rutina.objetivo,
        duration_minutes: rutina.duracion,
        blocks: rutina.bloques,
      })),
    );
  assertQuery("No se pudieron guardar las rutinas", error);
}

export async function eliminarRutinaSupabase(id: string) {
  const { error } = await getSupabaseClient()
    .from("routines")
    .delete()
    .eq("id", id);
  assertQuery("No se pudo eliminar la rutina", error);
}

export async function guardarPlantillas(plantillas: PlantillaPersistida[]) {
  if (plantillas.length === 0) return;
  const { error } = await getSupabaseClient()
    .from("routine_templates")
    .upsert(
      plantillas.map((plantilla) => ({
        id: plantilla.id,
        coach_id: plantilla.entrenadorId,
        title: plantilla.titulo,
        objective: plantilla.objetivo,
        duration_minutes: plantilla.duracion,
        blocks: plantilla.bloques,
      })),
    );
  assertQuery("No se pudieron guardar las plantillas", error);
}

export async function eliminarPlantillaSupabase(id: string) {
  const { error } = await getSupabaseClient()
    .from("routine_templates")
    .delete()
    .eq("id", id);
  assertQuery("No se pudo eliminar la plantilla", error);
}

export async function guardarEntrenamientos(
  entrenamientos: EntrenamientoProgramado[],
) {
  if (entrenamientos.length === 0) return;
  const { error } = await getSupabaseClient()
    .from("scheduled_workouts")
    .upsert(
      entrenamientos.map((item) => ({
        id: item.id,
        athlete_id: item.atletaId,
        workout_date: item.fecha,
        workout_time: item.hora,
        duration_minutes: item.duracionMinutos,
        status: item.estado,
        created_by_id: item.creadoPorId,
        notes: item.notas,
        origin: item.origen,
        routine_id: item.rutinaId,
        title: item.titulo,
        category: item.categoria,
        created_at: item.creadoEn,
        updated_at: item.actualizadoEn,
      })),
    );
  assertQuery("No se pudo guardar la agenda", error);
}

export async function eliminarEntrenamientoSupabase(id: string) {
  const { error } = await getSupabaseClient()
    .from("scheduled_workouts")
    .delete()
    .eq("id", id);
  assertQuery("No se pudo eliminar el entrenamiento", error);
}

export async function guardarActividad(actividad: ActividadRealizada) {
  const { error } = await getSupabaseClient().rpc("save_workout_activity", {
    activity: actividad,
    activity_sets: actividad.series,
  });
  assertQuery("No se pudo guardar la actividad", error);
}

function remapearId(id: number, mapeo: MapeoUsuarios) {
  return mapeo[String(id)] ?? id;
}

function remapearRutina(rutina: Rutina, mapeo: MapeoUsuarios): Rutina {
  return {
    ...rutina,
    atletaId: remapearId(rutina.atletaId, mapeo),
  };
}

function remapearEntrenamiento(
  entrenamiento: EntrenamientoProgramado,
  mapeo: MapeoUsuarios,
): EntrenamientoProgramado {
  return {
    ...entrenamiento,
    atletaId: remapearId(entrenamiento.atletaId, mapeo),
    creadoPorId: remapearId(entrenamiento.creadoPorId, mapeo),
  };
}

function remapearActividad(
  actividad: ActividadRealizada,
  mapeo: MapeoUsuarios,
): ActividadRealizada {
  return {
    ...actividad,
    atletaId: remapearId(actividad.atletaId, mapeo),
    registradaPorId: remapearId(actividad.registradaPorId, mapeo),
    rutinaSnapshot: actividad.rutinaSnapshot
      ? remapearRutina(actividad.rutinaSnapshot, mapeo)
      : null,
  };
}

export function remapearMutacionSupabase(
  mutacion: MutacionSupabase,
  mapeo: MapeoUsuarios,
): MutacionSupabase {
  switch (mutacion.tipo) {
    case "guardar-rutinas":
      return {
        ...mutacion,
        datos: mutacion.datos.map((rutina) =>
          remapearRutina(rutina, mapeo),
        ),
      };
    case "guardar-plantillas":
      return {
        ...mutacion,
        datos: mutacion.datos.map((plantilla) => ({
          ...plantilla,
          entrenadorId: remapearId(plantilla.entrenadorId, mapeo),
        })),
      };
    case "guardar-entrenamientos":
      return {
        ...mutacion,
        datos: mutacion.datos.map((entrenamiento) =>
          remapearEntrenamiento(entrenamiento, mapeo),
        ),
      };
    case "guardar-actividad":
      return {
        ...mutacion,
        datos: remapearActividad(mutacion.datos, mapeo),
      };
    default:
      return mutacion;
  }
}

export async function ejecutarMutacionSupabase(mutacion: MutacionSupabase) {
  switch (mutacion.tipo) {
    case "guardar-rutinas":
      return guardarRutinas(mutacion.datos);
    case "eliminar-rutina":
      return eliminarRutinaSupabase(mutacion.entidadId);
    case "guardar-plantillas":
      return guardarPlantillas(mutacion.datos);
    case "eliminar-plantilla":
      return eliminarPlantillaSupabase(mutacion.entidadId);
    case "guardar-entrenamientos":
      return guardarEntrenamientos(mutacion.datos);
    case "eliminar-entrenamiento":
      return eliminarEntrenamientoSupabase(mutacion.entidadId);
    case "guardar-actividad":
      return guardarActividad(mutacion.datos);
  }
}

async function migrarPerfiles(usuarios: Usuario[]) {
  const { data, error } = await getSupabaseClient().rpc("migrate_profiles", {
    local_profiles: usuarios,
  });
  assertQuery("No se pudieron migrar los perfiles", error);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Supabase no devolvió el mapeo de perfiles migrados.");
  }
  return Object.fromEntries(
    Object.entries(data).map(([id, destino]) => [id, Number(destino)]),
  ) as MapeoUsuarios;
}

async function insertarRutinasSiFaltan(rutinas: Rutina[]) {
  if (rutinas.length === 0) return;
  const { error } = await getSupabaseClient()
    .from("routines")
    .upsert(
      rutinas.map((rutina) => ({
        id: rutina.id,
        athlete_id: rutina.atletaId,
        title: rutina.titulo,
        objective: rutina.objetivo,
        duration_minutes: rutina.duracion,
        blocks: rutina.bloques,
      })),
      { onConflict: "id", ignoreDuplicates: true },
    );
  assertQuery("No se pudieron migrar las rutinas", error);
}

async function insertarPlantillasSiFaltan(
  plantillas: PlantillaPersistida[],
) {
  if (plantillas.length === 0) return;
  const { error } = await getSupabaseClient()
    .from("routine_templates")
    .upsert(
      plantillas.map((plantilla) => ({
        id: plantilla.id,
        coach_id: plantilla.entrenadorId,
        title: plantilla.titulo,
        objective: plantilla.objetivo,
        duration_minutes: plantilla.duracion,
        blocks: plantilla.bloques,
      })),
      { onConflict: "id", ignoreDuplicates: true },
    );
  assertQuery("No se pudieron migrar las plantillas", error);
}

async function insertarEntrenamientosSiFaltan(
  entrenamientos: EntrenamientoProgramado[],
) {
  if (entrenamientos.length === 0) return;
  const { error } = await getSupabaseClient()
    .from("scheduled_workouts")
    .upsert(
      entrenamientos.map((item) => ({
        id: item.id,
        athlete_id: item.atletaId,
        workout_date: item.fecha,
        workout_time: item.hora,
        duration_minutes: item.duracionMinutos,
        status: item.estado,
        created_by_id: item.creadoPorId,
        notes: item.notas,
        origin: item.origen,
        routine_id: item.rutinaId,
        title: item.titulo,
        category: item.categoria,
        created_at: item.creadoEn,
        updated_at: item.actualizadoEn,
      })),
      { onConflict: "id", ignoreDuplicates: true },
    );
  assertQuery("No se pudo migrar la agenda", error);
}

async function insertarActividadSiFalta(actividad: ActividadRealizada) {
  const { error } = await getSupabaseClient().rpc(
    "migrate_workout_activity",
    {
      activity: actividad,
      activity_sets: actividad.series,
    },
  );
  assertQuery("No se pudo migrar la actividad", error);
}

export async function migrarDatosFaltantes(locales: DatosPersistidos) {
  const mapeo = await migrarPerfiles(locales.usuarios);
  const rutinas = locales.rutinas.map((rutina) =>
    remapearRutina(rutina, mapeo),
  );
  const plantillas = locales.plantillas.map((plantilla) => ({
    ...plantilla,
    entrenadorId: remapearId(plantilla.entrenadorId, mapeo),
  }));
  const entrenamientos = locales.entrenamientos.map((entrenamiento) =>
    remapearEntrenamiento(entrenamiento, mapeo),
  );
  const actividades = locales.actividades.map((actividad) =>
    remapearActividad(actividad, mapeo),
  );

  await insertarRutinasSiFaltan(rutinas);
  await insertarPlantillasSiFaltan(plantillas);
  await insertarEntrenamientosSiFaltan(entrenamientos);
  await Promise.all(
    actividades.map(insertarActividadSiFalta),
  );
  return mapeo;
}
