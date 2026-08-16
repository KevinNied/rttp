export type CategoriaActividad =
  | "running"
  | "natacion"
  | "ciclismo"
  | "deporte"
  | "movilidad"
  | "otra";

export type EstadoEntrenamiento =
  | "programado"
  | "en-curso"
  | "completado"
  | "omitido";

type EntrenamientoBase = {
  id: string;
  atletaId: number;
  fecha: string;
  hora: string | null;
  duracionMinutos: number;
  estado: EstadoEntrenamiento;
  creadoPorId: number;
  notas: string;
  creadoEn: string;
  actualizadoEn: string;
};

export type EntrenamientoProgramado =
  | (EntrenamientoBase & {
      origen: "rutina";
      rutinaId: string;
      titulo: null;
      categoria: null;
    })
  | (EntrenamientoBase & {
      origen: "externo";
      rutinaId: null;
      titulo: string;
      categoria: CategoriaActividad;
    });

type SinMetadata<T> = T extends EntrenamientoProgramado
  ? Omit<T, "id" | "creadoEn" | "actualizadoEn">
  : never;

export type NuevoEntrenamientoProgramado =
  SinMetadata<EntrenamientoProgramado>;

export const categoriasActividad: {
  value: CategoriaActividad;
  label: string;
}[] = [
  { value: "running", label: "Running" },
  { value: "natacion", label: "Natación" },
  { value: "ciclismo", label: "Ciclismo" },
  { value: "deporte", label: "Deporte" },
  { value: "movilidad", label: "Movilidad" },
  { value: "otra", label: "Otra actividad" },
];

export function fechaLocal(fecha = new Date()) {
  const offset = fecha.getTimezoneOffset() * 60_000;
  return new Date(fecha.getTime() - offset).toISOString().slice(0, 10);
}

export function inicioDeSemana(fecha: string) {
  const base = new Date(`${fecha}T12:00:00`);
  const diasDesdeLunes = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - diasDesdeLunes);
  return fechaLocal(base);
}

export function sumarDias(fecha: string, cantidad: number) {
  const siguiente = new Date(`${fecha}T12:00:00`);
  siguiente.setDate(siguiente.getDate() + cantidad);
  return fechaLocal(siguiente);
}

export function crearIdEntrenamiento() {
  return `entrenamiento-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
