import { CategoriaActividad } from "@/lib/rttp-agenda";
import { Rutina } from "@/lib/rttp-data";

export type SerieActividad = {
  pasoId: string;
  ejercicioId: string;
  ejercicioNombre: string;
  bloqueId: string;
  bloqueNombre: string;
  ronda: number;
  peso: number;
  repeticiones: number;
  omitida: boolean;
};

export type ActividadRealizada = {
  id: string;
  atletaId: number;
  entrenamientoProgramadoId: string;
  tipo: "rutina" | "externa";
  titulo: string;
  categoria: CategoriaActividad | null;
  rutinaId: string | null;
  rutinaSnapshot: Rutina | null;
  fecha: string;
  completadaEn: string;
  duracionMinutos: number;
  esfuerzo: number | null;
  feedback: string;
  notas: string;
  series: SerieActividad[];
  registradaPorId: number;
};

export function idActividad(entrenamientoProgramadoId: string) {
  return `actividad-${entrenamientoProgramadoId}`;
}
