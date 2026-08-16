"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CalendarDays,
  LogOut,
  Dumbbell,
  Flame,
  GripVertical,
  House,
  LayoutGrid,
  ListChecks,
  Minus,
  MoveHorizontal,
  Plus,
  RotateCcw,
  Route,
  SkipForward,
  TimerReset,
  Trash2,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AgendaDeportiva } from "@/components/agenda-deportiva";
import {
  crearIdEntrenamiento,
  EntrenamientoProgramado,
  fechaLocal,
  NuevoEntrenamientoProgramado,
} from "@/lib/rttp-agenda";
import {
  Bloque,
  Ejercicio,
  Rutina,
  Usuario,
  rutinasIniciales,
  usuariosIniciales,
} from "@/lib/rttp-data";

type RegistroSerie = {
  peso: number;
  repeticiones: number;
  completada: boolean;
  omitida: boolean;
};

const storageKey = "rttp-rutinas-v4";
const templatesStorageKey = "rttp-plantillas-v1";
const sessionStorageKey = "rttp-usuario-v1";
const usersStorageKey = "rttp-usuarios-v1";
const selectedAthleteStorageKey = "rttp-atleta-seleccionado-v1";
const agendaStorageKey = "rttp-agenda-v1";

type PlantillaRutina = Omit<Rutina, "atletaId"> & {
  entrenadorId: number;
};

type VistaEntrenador = "resumen" | "atletas" | "rutinas";
type VistaAtleta = "inicio" | "rutinas" | "agenda";

function totalSeries(rutina: Rutina) {
  return rutina.bloques.reduce(
    (total, bloque) =>
      total +
      bloque.ejercicios.reduce(
        (subtotal, item) => subtotal + item.series,
        0,
      ),
    0,
  );
}

function cantidadEjercicios({ bloques }: Pick<Rutina, "bloques">) {
  return bloques.reduce(
    (total, bloque) => total + bloque.ejercicios.length,
    0,
  );
}

function repeticionesObjetivo(item: Ejercicio) {
  return item.repeticionesMin === item.repeticionesMax
    ? `${item.repeticionesMin}`
    : `${item.repeticionesMin}–${item.repeticionesMax}`;
}

function rondasDelBloque(bloque: Bloque) {
  return Math.max(0, ...bloque.ejercicios.map((item) => item.series));
}

function pasosDeRutina(rutina: Rutina, sesionId = rutina.id) {
  return rutina.bloques.flatMap((bloque, bloqueIndex) => {
    const rondas = rondasDelBloque(bloque);

    return Array.from({ length: rondas }, (_, rondaIndex) =>
      bloque.ejercicios
        .filter((item) => item.series > rondaIndex)
        .map((item, posicion) => ({
          ...item,
          pasoId: `${sesionId}-${item.id}-${rondaIndex}`,
          bloqueId: bloque.id,
          bloqueIndex,
          bloqueNombre: bloque.nombre,
          ronda: rondaIndex + 1,
          rondas,
          posicion,
          ejerciciosEnRonda: bloque.ejercicios.filter(
            (ejercicioActual) => ejercicioActual.series > rondaIndex,
          ).length,
        })),
    ).flat();
  });
}

function normalizarRutina(
  rutina: Rutina & { dia?: string },
): Rutina {
  return {
    id: rutina.id,
    atletaId: rutina.atletaId,
    titulo: rutina.titulo,
    objetivo: rutina.objetivo,
    duracion: rutina.duracion,
    bloques: rutina.bloques,
  };
}

function normalizarPlantilla(
  plantilla: PlantillaRutina & { dia?: string },
): PlantillaRutina {
  return {
    id: plantilla.id,
    titulo: plantilla.titulo,
    objetivo: plantilla.objetivo,
    duracion: plantilla.duracion,
    bloques: plantilla.bloques,
    entrenadorId: plantilla.entrenadorId,
  };
}

function rutinaDesdePlantilla(
  plantilla: PlantillaRutina,
  atletaId: number,
): Rutina {
  const idBase = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    ...plantilla,
    id: `rutina-${atletaId}-${idBase}`,
    atletaId,
    bloques: plantilla.bloques.map((bloque, bloqueIndex) => ({
      ...bloque,
      id: `bloque-${idBase}-${bloqueIndex}`,
      ejercicios: bloque.ejercicios.map((ejercicio, ejercicioIndex) => ({
        ...ejercicio,
        id: `ejercicio-${idBase}-${bloqueIndex}-${ejercicioIndex}`,
      })),
    })),
  };
}

function idPlantilla(entrenadorId: number) {
  return `plantilla-${entrenadorId}-${Date.now()}`;
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/rttp-mark-v2.png"
        alt=""
        width={36}
        height={36}
        unoptimized
        className="size-9 object-contain drop-shadow-[0_0_14px_rgba(99,102,241,.2)]"
      />
      <div>
        <div className="text-sm font-semibold tracking-[0.24em] text-white">
          RTTP
        </div>
        <div className="text-[9px] uppercase tracking-[0.18em] text-indigo-200/40">
          Return To The Prime
        </div>
      </div>
    </div>
  );
}

function LandingAcceso({
  onAccess,
}: {
  onAccess: (email: string) => boolean;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function ingresar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onAccess(email)) return;
    setError("No encontramos un usuario con ese email.");
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#07080b] px-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(34,211,238,.15),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(124,58,237,.2),transparent_38%)]" />
      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div className="relative size-32">
          <Image
            src="/rttp-mark-v2.png"
            alt="Logo de RTTP"
            fill
            priority
            unoptimized
            sizes="128px"
            className="object-contain drop-shadow-[0_18px_35px_rgba(79,70,229,.28)]"
          />
        </div>

        <div
          aria-label="RTTP"
          className="mt-7 flex items-center gap-1 text-3xl font-semibold tracking-[0.18em]"
        >
          <span className="bg-gradient-to-br from-cyan-200 to-cyan-400 bg-clip-text text-transparent">
            R
          </span>
          <span className="bg-gradient-to-br from-blue-300 to-blue-500 bg-clip-text text-transparent">
            T
          </span>
          <span className="bg-gradient-to-br from-indigo-300 to-indigo-500 bg-clip-text text-transparent">
            T
          </span>
          <span className="bg-gradient-to-br from-violet-300 to-violet-500 bg-clip-text text-transparent">
            P
          </span>
        </div>

        <h1 className="mt-9 text-[2.35rem] font-light leading-[1.08] tracking-[-0.045em]">
          <span className="block">¿Listo para volver</span>
          <span className="block">a tu prime?</span>
        </h1>
        <Dialog>
          <DialogTrigger
            render={
              <Button className="mt-9 h-12 min-w-44 rounded-full border border-blue-200/15 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 px-8 text-white shadow-[0_12px_40px_rgba(79,70,229,.28)] hover:brightness-110" />
            }
          >
            Acceder
            <ArrowRight className="size-4" />
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-[#111217] text-white sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Ingresá a RTTP</DialogTitle>
              <DialogDescription className="text-white/40">
                Usá el email que registró tu entrenador.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={ingresar} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-xs text-white/55">Email</span>
                <Input
                  autoFocus
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  placeholder="vos@email.com"
                  aria-invalid={Boolean(error)}
                  className="h-11 border-white/10 bg-black/35"
                />
              </label>
              {error && (
                <p role="alert" className="text-xs text-red-300">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={!email.trim()}
                className="h-11 w-full rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
              >
                Entrar
                <ArrowRight />
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}

function AppShell({
  usuario,
  vistaPrevia,
  vistaEntrenador,
  vistaAtleta,
  onClosePreview,
  onLogout,
  children,
}: {
  usuario: Usuario;
  vistaPrevia: boolean;
  vistaEntrenador: VistaEntrenador;
  vistaAtleta: VistaAtleta;
  onClosePreview: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const esEntrenador = usuario.rol === "entrenador";
  const encabezadoEntrenador =
    vistaEntrenador === "atletas"
      ? ["Atletas", "Perfiles y planificación individual"]
      : vistaEntrenador === "rutinas"
        ? ["Biblioteca de rutinas", "Plantillas reutilizables para tus atletas"]
        : ["Resumen", "Organización y seguimiento de planes"];
  const encabezado = esEntrenador
    ? encabezadoEntrenador
    : vistaAtleta === "agenda"
      ? ["Agenda deportiva", "Tu semana de entrenamiento"]
      : vistaAtleta === "rutinas"
        ? ["Rutinas", "Todos tus planes asignados"]
        : ["Inicio", "Tu entrenamiento de hoy"];

  return (
    <div className="min-h-screen bg-[#07080b] text-white selection:bg-cyan-300 selection:text-black">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_-10%,rgba(34,211,238,.14),transparent_32%),radial-gradient(circle_at_10%_70%,rgba(124,58,237,.15),transparent_35%)]" />
      {!vistaPrevia && (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.07] bg-[#0a0b0f]/92 px-5 py-7 backdrop-blur-xl lg:flex">
          <Logo />
          <div className="mt-10 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
            {esEntrenador ? "Workspace" : "Entrenamiento"}
          </div>
          <nav className="mt-3 space-y-1.5">
            {(esEntrenador
              ? [
                  [LayoutGrid, "Resumen", "Vista general", "/entrenador", "resumen"],
                  [
                    Users,
                    "Atletas",
                    "Gestioná tus alumnos",
                    "/entrenador/atletas",
                    "atletas",
                  ],
                  [
                    ListChecks,
                    "Rutinas",
                    "Plantillas y planes",
                    "/entrenador/rutinas",
                    "rutinas",
                  ],
                ]
              : [
                  [House, "Inicio", "Tu entrenamiento de hoy", "/", "inicio"],
                  [
                    CalendarDays,
                    "Agenda",
                    "Organizá tu semana",
                    "/agenda",
                    "agenda",
                  ],
                  [
                    Dumbbell,
                    "Rutinas",
                    "Todos tus planes",
                    "/rutinas",
                    "rutinas",
                  ],
                ]
            ).map(([Icon, label, description, href, vista]) => {
              const NavIcon = Icon as typeof LayoutGrid;
              return (
                <Link
                  key={label as string}
                  href={href as string}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 transition-colors",
                    (esEntrenador
                      ? vista === vistaEntrenador
                      : vista === vistaAtleta)
                      ? "bg-indigo-300/10 text-white"
                      : "text-indigo-100/45 hover:bg-indigo-300/[0.07] hover:text-white/80",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.035]">
                    <NavIcon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{label as string}</span>
                    <span className="mt-0.5 block text-[10px] text-white/25 transition-colors group-hover:text-white/40">
                      {description as string}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex items-center gap-3 rounded-2xl border border-indigo-200/[0.08] bg-indigo-300/[0.06] p-3.5">
            <Avatar className="size-9 border border-violet-200/15">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-[10px] text-white">
                {usuario.nombre.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm">{usuario.nombre}</div>
              <div className="text-[10px] text-indigo-100/35">
                {esEntrenador ? "Entrenador" : "Atleta"}
              </div>
            </div>
          </div>
        </aside>
      )}

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 flex h-18 items-center justify-between border-b border-white/[0.07] bg-[#07080b]/88 px-4 backdrop-blur-xl lg:px-8",
          !vistaPrevia && "lg:left-64",
        )}
      >
        <div className={cn(!vistaPrevia && "lg:hidden")}>
          <Logo />
        </div>
        {!vistaPrevia && (
          <div className="hidden lg:block">
            <div className="text-sm font-medium text-white/85">
              {encabezado[0]}
            </div>
            <div className="mt-0.5 text-[10px] text-white/30">
              {encabezado[1]}
            </div>
          </div>
        )}
        {!esEntrenador && !vistaPrevia && (
          <nav className="flex items-center gap-1 lg:hidden">
            {[
              [House, "Inicio", "/", "inicio"],
              [CalendarDays, "Agenda", "/agenda", "agenda"],
              [Dumbbell, "Rutinas", "/rutinas", "rutinas"],
            ].map(([Icon, label, href, vista]) => {
              const NavIcon = Icon as typeof Dumbbell;
              return (
                <Link
                  key={label as string}
                  href={href as string}
                  aria-label={label as string}
                  className={cn(
                    "grid size-9 place-items-center rounded-full transition-colors",
                    vista === vistaAtleta
                      ? "bg-cyan-300/10 text-cyan-100"
                      : "text-white/30 hover:bg-white/[0.06] hover:text-white/70",
                  )}
                >
                  <NavIcon className="size-4" />
                </Link>
              );
            })}
          </nav>
        )}
        <div className="flex items-center gap-2">
          {vistaPrevia && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClosePreview}
              className="rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"
            >
              <ArrowLeft />
              Volver a editar
            </Button>
          )}
          {!vistaPrevia && (
            <div
              className={cn(
                "hidden text-right sm:block",
                esEntrenador && "lg:hidden",
              )}
            >
              <div className="text-[11px]">{usuario.nombre}</div>
              <div className="text-[9px] text-white/30">
                {usuario.rol === "entrenador" ? "Entrenador" : "Atleta"}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            className="h-9 rounded-full px-3 text-white/40 hover:bg-white/[0.07] hover:text-white"
          >
            <LogOut />
            <span className="hidden text-xs lg:inline">Cerrar sesión</span>
          </Button>
        </div>
      </header>

      <main
        className={cn(
          "relative min-h-screen pt-18",
          !vistaPrevia && "lg:pl-64",
        )}
      >
        {children}
      </main>
    </div>
  );
}

function SelectorRutina({
  rutinas,
  rutinaActiva,
  onSelect,
  desktopVertical = false,
}: {
  rutinas: Rutina[];
  rutinaActiva: Rutina;
  onSelect: (id: string) => void;
  desktopVertical?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2",
        desktopVertical && "xl:grid-cols-1 xl:gap-3",
      )}
    >
      {rutinas.map((rutina, index) => (
        <button
          key={rutina.id}
          onClick={() => onSelect(rutina.id)}
          className={cn(
            "rounded-2xl border p-3 text-left transition-all",
            desktopVertical && "xl:p-4",
            rutina.id === rutinaActiva.id
              ? index % 2 === 0
                ? "border-blue-300/35 bg-blue-400/[0.10]"
                : "border-violet-300/35 bg-violet-400/[0.10]"
              : "border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.06]",
          )}
        >
          <div
            className={cn(
              "truncate text-sm font-medium",
              desktopVertical && "xl:text-base",
            )}
          >
            {rutina.titulo}
          </div>
          <div
            className={cn(
              "mt-1 text-[10px] text-indigo-100/35",
              desktopVertical && "xl:mt-2 xl:text-xs",
            )}
          >
            {cantidadEjercicios(rutina)} ejercicios · {totalSeries(rutina)} series
          </div>
        </button>
      ))}
    </div>
  );
}

function FilaEjercicio({
  item,
  bloqueId,
  onUpdate,
  onDelete,
}: {
  item: Ejercicio;
  bloqueId: string;
  onUpdate: (item: Ejercicio) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { bloqueId } });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "mx-3 my-2 grid gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-3 py-3 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center xl:mx-4 xl:my-3 xl:gap-5 xl:px-4 xl:py-4",
        isDragging && "relative z-20 border-cyan-300/30 bg-[#161920] opacity-70 shadow-2xl",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Arrastrar ${item.nombre}`}
          className="touch-none cursor-grab rounded-lg p-1 text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/55 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-violet-300/10 text-[10px] font-medium text-violet-100/60 xl:size-10 xl:text-xs">
          {item.nombre
            .split(" ")
            .map((palabra) => palabra[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm xl:text-base">{item.nombre}</div>
          <Input
            value={item.aclaraciones}
            onChange={(event) =>
              onUpdate({ ...item, aclaraciones: event.target.value })
            }
            aria-label={`Aclaraciones de ${item.nombre}`}
            placeholder="Agregar aclaraciones"
            className="mt-1 h-6 border-0 bg-transparent p-0 text-[10px] text-violet-100/55 shadow-none placeholder:text-white/20 focus-visible:ring-0 xl:text-xs"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 md:justify-start">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              onUpdate({ ...item, series: Math.max(1, item.series - 1) })
            }
            className="rounded-full text-indigo-100/40 hover:bg-indigo-300/10 hover:text-white"
            aria-label={`Quitar una serie de ${item.nombre}`}
          >
            <Minus />
          </Button>
          <div className="w-10 text-center">
            <div className="text-sm">{item.series}</div>
            <div className="text-[8px] uppercase text-indigo-100/25">series</div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onUpdate({ ...item, series: item.series + 1 })}
            className="rounded-full text-indigo-100/40 hover:bg-indigo-300/10 hover:text-white"
            aria-label={`Agregar una serie a ${item.nombre}`}
          >
            <Plus />
          </Button>
        </div>
        <div className="space-y-1">
          <select
            value={
              item.repeticionesMin === item.repeticionesMax
                ? "fijas"
                : "rango"
            }
            onChange={(event) => {
              if (event.target.value === "fijas") {
                onUpdate({
                  ...item,
                  repeticionesMax: item.repeticionesMin,
                });
              } else {
                onUpdate({
                  ...item,
                  repeticionesMax: Math.max(
                    item.repeticionesMin + 1,
                    item.repeticionesMax,
                  ),
                });
              }
            }}
            aria-label={`Tipo de repeticiones de ${item.nombre}`}
            className="h-8 rounded-lg border border-white/10 bg-black/25 px-2 text-[10px] text-white outline-none focus:border-cyan-300/40"
          >
            <option value="fijas">Reps. fijas</option>
            <option value="rango">Rango</option>
          </select>
          {item.repeticionesMin === item.repeticionesMax ? (
            <label className="block w-28 text-center">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={item.repeticionesMin}
                onChange={(event) => {
                  const repeticiones = Math.max(0, Number(event.target.value));
                  onUpdate({
                    ...item,
                    repeticionesMin: repeticiones,
                    repeticionesMax: repeticiones,
                  });
                }}
                aria-label={`Repeticiones de ${item.nombre}`}
                className="h-8 border-white/10 bg-black/25 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div className="mt-1 text-[8px] uppercase text-indigo-100/25">
                repeticiones
              </div>
            </label>
          ) : (
            <div className="flex gap-1">
              <label className="w-16 text-center">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={item.repeticionesMin}
                  onChange={(event) =>
                    onUpdate({
                      ...item,
                      repeticionesMin: Math.min(
                        item.repeticionesMax,
                        Math.max(0, Number(event.target.value)),
                      ),
                    })
                  }
                  aria-label={`Repeticiones mínimas de ${item.nombre}`}
                  className="h-8 border-white/10 bg-black/25 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <div className="mt-1 text-[8px] uppercase text-indigo-100/25">
                  mín.
                </div>
              </label>
              <label className="w-16 text-center">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={item.repeticionesMin}
                  value={item.repeticionesMax}
                  onChange={(event) =>
                    onUpdate({
                      ...item,
                      repeticionesMax: Math.max(
                        item.repeticionesMin,
                        Number(event.target.value),
                      ),
                    })
                  }
                  aria-label={`Repeticiones máximas de ${item.nombre}`}
                  className="h-8 border-white/10 bg-black/25 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <div className="mt-1 text-[8px] uppercase text-indigo-100/25">
                  máx.
                </div>
              </label>
            </div>
          )}
        </div>
        <label className="w-20 text-center">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.5"
            value={item.peso}
            onChange={(event) =>
              onUpdate({
                ...item,
                peso: Math.max(0, Number(event.target.value)),
              })
            }
            aria-label={`Peso de ${item.nombre}`}
            className="h-8 border-white/10 bg-black/25 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <div className="mt-1 text-[8px] uppercase text-indigo-100/25">
            peso (kg)
          </div>
        </label>
        <label className="w-20 text-center">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="—"
            value={item.descanso ?? ""}
            onChange={(event) =>
              onUpdate({
                ...item,
                descanso:
                  event.target.value === ""
                    ? null
                    : Math.max(0, Number(event.target.value)),
              })
            }
            aria-label={`Descanso de ${item.nombre}`}
            className="h-8 border-white/10 bg-black/25 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <div className="mt-1 text-[8px] uppercase text-indigo-100/25">
            descanso (s)
          </div>
        </label>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        className="hidden text-indigo-100/20 hover:bg-red-400/10 hover:text-red-200 md:inline-flex"
        aria-label={`Eliminar ${item.nombre}`}
      >
        <X />
      </Button>
    </div>
  );
}

function BloqueEditor({
  bloque,
  index,
  abierto,
  onToggle,
  children,
}: {
  bloque: Bloque;
  index: number;
  abierto: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `bloque:${bloque.id}`,
    data: { bloqueId: bloque.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-shadow",
        isOver && "relative z-10 ring-1 ring-inset ring-cyan-300/45",
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 text-left transition-colors xl:px-5 xl:py-4",
          index % 2 === 0
            ? "bg-blue-400/[0.045] hover:bg-blue-400/[0.09]"
            : "bg-violet-400/[0.045] hover:bg-violet-400/[0.09]",
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full text-[9px] font-semibold text-indigo-950 xl:size-7",
              index % 3 === 0
                ? "bg-cyan-300"
                : index % 3 === 1
                  ? "bg-violet-300"
                  : "bg-blue-300",
            )}
          >
            {index + 1}
          </span>
          <span className="text-xs font-medium xl:text-sm">{bloque.nombre}</span>
          <span className="hidden text-[9px] text-white/30 sm:inline xl:text-[10px]">
            {bloque.tipo}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-wider text-white/30">
            {rondasDelBloque(bloque)} ronda
            {rondasDelBloque(bloque) === 1 ? "" : "s"}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-white/25 transition-transform",
              abierto && "rotate-180",
            )}
          />
        </div>
      </button>
      {abierto && (
        <SortableContext
          items={bloque.ejercicios.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="py-1">
            {children}
            {bloque.ejercicios.length === 0 && (
              <div className="m-3 rounded-2xl border border-dashed border-cyan-200/15 bg-cyan-300/[0.025] p-6 text-center">
                <div className="mx-auto grid size-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200/70">
                  <GripVertical className="size-4" />
                </div>
                <div className="mt-3 text-xs text-white/55">
                  Este bloque está listo
                </div>
                <div className="mx-auto mt-1 max-w-xs text-[10px] leading-relaxed text-white/30">
                  Agregá el primer ejercicio con el botón superior. Después
                  podés arrastrarlo para ordenar la rutina o moverlo a otro
                  bloque.
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

function DialogoEjercicio({
  bloques,
  onAdd,
}: {
  bloques: Bloque[];
  onAdd: (item: Ejercicio, bloqueId: string, nuevoBloque?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [series, setSeries] = useState("3");
  const [modoRepeticiones, setModoRepeticiones] = useState<"fijas" | "rango">(
    "fijas",
  );
  const [repeticiones, setRepeticiones] = useState("10");
  const [repeticionesMin, setRepeticionesMin] = useState("10");
  const [repeticionesMax, setRepeticionesMax] = useState("10");
  const [peso, setPeso] = useState("0");
  const [descanso, setDescanso] = useState("");
  const [aclaraciones, setAclaraciones] = useState("");
  const [bloqueId, setBloqueId] = useState(bloques?.[0]?.id ?? "nuevo");
  const [nuevoBloque, setNuevoBloque] = useState("");

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (siguiente) return;
    setNombre("");
    setSeries("3");
    setModoRepeticiones("fijas");
    setRepeticiones("10");
    setRepeticionesMin("10");
    setRepeticionesMax("10");
    setPeso("0");
    setDescanso("");
    setAclaraciones("");
    setBloqueId(bloques?.[0]?.id ?? "nuevo");
    setNuevoBloque("");
  }

  function agregar() {
    if (!nombre.trim() || (bloqueId === "nuevo" && !nuevoBloque.trim())) return;
    onAdd(
      {
        id: `${nombre.toLowerCase().replace(/\W+/g, "-")}-${Date.now()}`,
        nombre: nombre.trim(),
        series: Math.max(1, Number(series) || 1),
        repeticionesMin: Math.max(
          0,
          Number(
            modoRepeticiones === "fijas" ? repeticiones : repeticionesMin,
          ) || 0,
        ),
        repeticionesMax:
          modoRepeticiones === "fijas"
            ? Math.max(0, Number(repeticiones) || 0)
            : Math.max(
                Number(repeticionesMin) || 0,
                Number(repeticionesMax) || 0,
              ),
        peso: Math.max(0, Number(peso) || 0),
        descanso:
          descanso.trim() === "" ? null : Math.max(0, Number(descanso)),
        aclaraciones: aclaraciones.trim(),
      },
      bloqueId,
      nuevoBloque.trim(),
    );
  }

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger
        render={
          <Button className="rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200" />
        }
      >
        <Plus />
        Agregar ejercicio
      </DialogTrigger>
      <DialogContent className="border-violet-200/15 bg-[#111217] text-white">
        <DialogHeader>
          <DialogTitle>Nuevo ejercicio</DialogTitle>
          <DialogDescription className="text-indigo-100/45">
            Elegí un bloque existente o creá uno nuevo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <label className="space-y-2">
            <span className="text-xs text-indigo-100/55">Nombre</span>
            <Input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Peso muerto"
              className="border-white/10 bg-black/35"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs text-indigo-100/55">Bloque</span>
            <select
              value={bloqueId}
              onChange={(event) => setBloqueId(event.target.value)}
              className="h-9 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none focus:border-cyan-300/40"
            >
              {bloques.map((bloque) => (
                <option key={bloque.id} value={bloque.id}>
                  {bloque.nombre}
                </option>
              ))}
              <option value="nuevo">+ Crear bloque nuevo</option>
            </select>
          </label>
          {bloqueId === "nuevo" && (
            <label className="block space-y-2">
              <span className="text-xs text-indigo-100/55">
                Nombre del nuevo bloque
              </span>
              <Input
                value={nuevoBloque}
                onChange={(event) => setNuevoBloque(event.target.value)}
                placeholder="Ej. Potencia"
                className="border-white/10 bg-black/35"
              />
            </label>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ["Series", series, setSeries],
              ["Peso", peso, setPeso],
              ["Descanso", descanso, setDescanso],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="space-y-2">
                <span className="text-xs text-indigo-100/55">
                  {label as string}
                </span>
                <Input
                  type="number"
                  inputMode={
                    (label as string).startsWith("Peso")
                      ? "decimal"
                      : "numeric"
                  }
                  min={0}
                  step={(label as string).startsWith("Peso") ? "0.5" : "1"}
                  placeholder={
                    (label as string).startsWith("Descanso") ? "Opcional" : ""
                  }
                  value={value as string}
                  onChange={(event) =>
                    (setter as React.Dispatch<React.SetStateAction<string>>)(
                      event.target.value,
                    )
                  }
                  className="border-white/10 bg-black/35"
                />
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <span className="text-xs text-indigo-100/55">Repeticiones</span>
            <div className="flex rounded-xl border border-white/10 bg-black/20 p-1 text-xs">
              {[
                ["fijas", "Número fijo"],
                ["rango", "Mínimo y máximo"],
              ].map(([modo, etiqueta]) => (
                <button
                  key={modo}
                  type="button"
                  onClick={() => setModoRepeticiones(modo as "fijas" | "rango")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 transition-colors",
                    modoRepeticiones === modo
                      ? "bg-cyan-300 text-indigo-950"
                      : "text-white/45 hover:text-white",
                  )}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
            {modoRepeticiones === "fijas" ? (
              <label className="block space-y-2">
                <span className="text-xs text-indigo-100/55">
                  Repeticiones
                </span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={repeticiones}
                  onChange={(event) => setRepeticiones(event.target.value)}
                  className="border-white/10 bg-black/35"
                />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-2">
                  <span className="text-xs text-indigo-100/55">Mínimas</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={repeticionesMin}
                    onChange={(event) => setRepeticionesMin(event.target.value)}
                    className="border-white/10 bg-black/35"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs text-indigo-100/55">Máximas</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={Number(repeticionesMin) || 0}
                    value={repeticionesMax}
                    onChange={(event) => setRepeticionesMax(event.target.value)}
                    className="border-white/10 bg-black/35"
                  />
                </label>
              </div>
            )}
          </div>
          <label className="block space-y-2">
            <span className="text-xs text-indigo-100/55">Aclaraciones</span>
            <Input
              value={aclaraciones}
              onChange={(event) => setAclaraciones(event.target.value)}
              placeholder="Ej. Con barra · cada lado"
              className="border-white/10 bg-black/35"
            />
          </label>
        </div>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="ghost" className="text-indigo-100/50" />
            }
          >
            Cancelar
          </DialogClose>
          <DialogClose
            render={
              <Button
                onClick={agregar}
                disabled={
                  !nombre.trim() ||
                  (bloqueId === "nuevo" && !nuevoBloque.trim())
                }
                className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
              />
            }
          >
            Agregar
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogoNuevaRutina({
  atleta,
  onCreate,
}: {
  atleta: Usuario;
  onCreate: (rutina: Rutina) => void;
}) {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [duracion, setDuracion] = useState("");

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (siguiente) return;
    setTitulo("");
    setObjetivo("");
    setDuracion("");
  }

  function crear() {
    if (!titulo.trim()) return;

    const timestamp = Date.now();
    onCreate({
      id: `rutina-${atleta.id}-${timestamp}`,
      atletaId: atleta.id,
      titulo: titulo.trim(),
      objetivo: objetivo.trim() || "Entrenamiento personalizado",
      duracion: Math.max(1, Number(duracion) || 60),
      bloques: [
        {
          id: `bloque-${timestamp}`,
          nombre: "Bloque 1",
          tipo: "Personalizado",
          ejercicios: [],
        },
      ],
    });
  }

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="rounded-full border-indigo-200/10 bg-indigo-300/[0.05] text-white hover:bg-indigo-300/10 hover:text-white"
          />
        }
      >
        <Plus />
        Nueva rutina
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#111217] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear rutina para {atleta.nombre}</DialogTitle>
          <DialogDescription className="text-white/40">
            Empezá con un bloque vacío y completá los demás datos cuando quieras.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Nombre</span>
            <Input
              autoFocus
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Ej. Potencia"
              className="border-white/10 bg-black/35"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Objetivo (opcional)</span>
            <Input
              value={objetivo}
              onChange={(event) => setObjetivo(event.target.value)}
              placeholder="Ej. Fuerza y estabilidad"
              className="border-white/10 bg-black/35"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs text-white/55">
              Duración estimada (minutos, opcional)
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={duracion}
              onChange={(event) => setDuracion(event.target.value)}
              className="border-white/10 bg-black/35"
            />
          </label>
          <div className="rounded-2xl border border-dashed border-cyan-200/15 bg-cyan-300/[0.04] p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                <GripVertical className="size-4" />
              </div>
              <div>
                <div className="text-xs text-white/75">
                  Constructor flexible
                </div>
                <div className="mt-1 text-[10px] leading-relaxed text-white/35">
                  Mové ejercicios dentro de un bloque o arrastralos hacia otro.
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button variant="ghost" className="text-white/45" />}
            >
              Cancelar
            </DialogClose>
            <DialogClose
              render={
                <Button
                  type="button"
                  onClick={crear}
                  disabled={!titulo.trim()}
                  className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
                />
              }
            >
              Crear y editar
              <ArrowRight />
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DialogoDetallesRutina({
  rutina,
  onUpdate,
}: {
  rutina: Rutina;
  onUpdate: (rutina: Rutina) => void;
}) {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState(rutina.titulo);
  const [objetivo, setObjetivo] = useState(rutina.objetivo);
  const [duracion, setDuracion] = useState(String(rutina.duracion));

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (!siguiente) return;
    setTitulo(rutina.titulo);
    setObjetivo(
      rutina.objetivo === "Entrenamiento personalizado" ? "" : rutina.objetivo,
    );
    setDuracion(String(rutina.duracion));
  }

  function guardar() {
    if (!titulo.trim()) return;
    onUpdate({
      ...rutina,
      titulo: titulo.trim(),
      objetivo: objetivo.trim() || "Entrenamiento personalizado",
      duracion: Math.max(1, Number(duracion) || 60),
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-white/10 bg-transparent text-white/65 hover:bg-white/[0.06] hover:text-white"
          />
        }
      >
        Editar detalles
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#111217] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalles de la rutina</DialogTitle>
          <DialogDescription className="text-white/40">
            El nombre es obligatorio. Los demás campos son opcionales.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Nombre</span>
            <Input
              autoFocus
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              className="border-white/10 bg-black/35"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Objetivo (opcional)</span>
            <Input
              value={objetivo}
              onChange={(event) => setObjetivo(event.target.value)}
              placeholder="Ej. Fuerza y estabilidad"
              className="border-white/10 bg-black/35"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs text-white/55">
              Duración estimada (minutos, opcional)
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={duracion}
              onChange={(event) => setDuracion(event.target.value)}
              className="border-white/10 bg-black/35"
            />
          </label>
        </div>
        <DialogFooter>
          <DialogClose
            render={<Button variant="ghost" className="text-white/45" />}
          >
            Cancelar
          </DialogClose>
          <Button
            type="button"
            onClick={guardar}
            disabled={!titulo.trim()}
            className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
          >
            Guardar detalles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogoAsignarPlantilla({
  plantilla,
  atletas,
  onAssign,
}: {
  plantilla: PlantillaRutina;
  atletas: Usuario[];
  onAssign: (atletaId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [atletaId, setAtletaId] = useState(String(atletas[0]?.id ?? ""));

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (siguiente) setAtletaId(String(atletas[0]?.id ?? ""));
  }

  function asignar() {
    const id = Number(atletaId);
    if (!id) return;
    onAssign(id);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
          />
        }
      >
        Asignar
        <ArrowRight />
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#111217] text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Asignar “{plantilla.titulo}”</DialogTitle>
          <DialogDescription className="text-white/40">
            Se creará una copia independiente para el atleta, lista para
            personalizar pesos y detalles.
          </DialogDescription>
        </DialogHeader>
        <label className="block space-y-2">
          <span className="text-xs text-white/55">Atleta</span>
          <select
            value={atletaId}
            onChange={(event) => setAtletaId(event.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none focus:border-cyan-300/40"
          >
            {atletas.map((atleta) => (
              <option key={atleta.id} value={atleta.id}>
                {atleta.nombre}
              </option>
            ))}
          </select>
        </label>
        <DialogFooter>
          <DialogClose
            render={<Button variant="ghost" className="text-white/45" />}
          >
            Cancelar
          </DialogClose>
          <Button
            type="button"
            onClick={asignar}
            disabled={!atletaId}
            className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
          >
            Asignar rutina
            <ArrowRight />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogoNuevoAtleta({
  usuarios,
  onCreate,
}: {
  usuarios: Usuario[];
  onCreate: (nombre: string, email: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (siguiente) return;
    setNombre("");
    setEmail("");
    setError("");
  }

  function crear() {
    const emailNormalizado = email.trim().toLowerCase();
    if (
      usuarios.some(
        (item) => item.email.toLowerCase() === emailNormalizado,
      )
    ) {
      setError("Ya existe un usuario con ese email.");
      return;
    }
    onCreate(nombre.trim(), emailNormalizado);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger
        render={
          <button
            aria-label="Agregar alumno"
            title="Agregar alumno"
            className="grid size-10 place-items-center rounded-full border border-dashed border-white/10 text-white/35 transition-colors hover:border-cyan-200/25 hover:bg-cyan-300/[0.07] hover:text-cyan-100"
          />
        }
      >
        <Plus className="size-4" />
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#111217] text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar alumno</DialogTitle>
          <DialogDescription className="text-white/40">
            Podrá ingresar a RTTP usando este email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Nombre</span>
            <Input
              autoFocus
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Juan"
              className="border-white/10 bg-black/35"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Email</span>
            <Input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              placeholder="juan@email.com"
              className="border-white/10 bg-black/35"
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-red-300">
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose
              render={<Button variant="ghost" className="text-white/45" />}
            >
              Cancelar
            </DialogClose>
            <Button
              type="button"
              onClick={crear}
              disabled={!nombre.trim() || !email.trim()}
              className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
            >
              Agregar alumno
              <ArrowRight />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HomeEntrenador({
  entrenador,
  usuarios,
  atletas,
  atleta,
  rutinas,
  rutinasPorAtleta,
  entrenamientos,
  plantillas,
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
}: {
  entrenador: Usuario;
  usuarios: Usuario[];
  atletas: Usuario[];
  atleta: Usuario;
  rutinas: Rutina[];
  rutinasPorAtleta: Rutina[];
  entrenamientos: EntrenamientoProgramado[];
  plantillas: PlantillaRutina[];
  vista: VistaEntrenador;
  detalleAtleta: boolean;
  rutina: Rutina;
  onSelectAtleta: (id: number) => void;
  onSelect: (id: string) => void;
  onSaveRutina: (rutina: Rutina) => void;
  onCreateRutina: (rutina: Rutina) => void;
  onSaveAsTemplate: (rutina: Rutina) => void;
  onAssignTemplate: (plantillaId: string, atletaId: number) => void;
  onDeleteTemplate: (plantillaId: string) => void;
  onCreateAtleta: (nombre: string, email: string) => void;
  onDeleteRutina: (id: string) => void;
  onCreateEntrenamiento: (item: NuevoEntrenamientoProgramado) => void;
  onUpdateEntrenamiento: (item: EntrenamientoProgramado) => void;
  onDeleteEntrenamiento: (id: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  verComoAtleta: () => void;
}) {
  const [rutina, setRutina] = useState(rutinaGuardada);
  const [bloqueAbierto, setBloqueAbierto] = useState<string | null>(null);
  const [accionPendiente, setAccionPendiente] = useState<(() => void) | null>(
    null,
  );
  const [guardadoVisible, setGuardadoVisible] = useState(false);
  const hayCambios =
    JSON.stringify(rutina) !== JSON.stringify(rutinaGuardada);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
    setRutina(rutinaGuardada);
    accionPendiente?.();
    setAccionPendiente(null);
  }

  function actualizarEjercicio(
    bloqueId: string,
    ejercicioId: string,
    siguiente: Ejercicio,
  ) {
    setRutina((actual) => ({
      ...actual,
      bloques: actual.bloques.map((bloque) =>
        bloque.id === bloqueId
          ? {
              ...bloque,
              ejercicios: bloque.ejercicios.map((item) =>
                item.id === ejercicioId ? siguiente : item,
              ),
            }
          : bloque,
      ),
    }));
  }

  function eliminarEjercicio(bloqueId: string, ejercicioId: string) {
    setRutina((actual) => ({
      ...actual,
      bloques: actual.bloques.map((bloque) =>
        bloque.id === bloqueId
          ? {
              ...bloque,
              ejercicios: bloque.ejercicios.filter(
                (item) => item.id !== ejercicioId,
              ),
            }
          : bloque,
      ),
    }));
  }

  function agregarEjercicio(
    item: Ejercicio,
    bloqueId: string,
    nuevoBloque?: string,
  ) {
    if (bloqueId === "nuevo" && nuevoBloque) {
      const id = `bloque-${Date.now()}`;
      setRutina((actual) => ({
        ...actual,
        bloques: [
          ...actual.bloques,
          {
            id,
            nombre: nuevoBloque,
            tipo: "Personalizado",
            ejercicios: [item],
          },
        ],
      }));
      setBloqueAbierto(id);
      return;
    }

    setRutina((actual) => ({
      ...actual,
      bloques: actual.bloques.map((bloque) =>
        bloque.id === bloqueId
          ? { ...bloque, ejercicios: [...bloque.ejercicios, item] }
          : bloque,
      ),
    }));
    setBloqueAbierto(bloqueId);
  }

  function moverEjercicio(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const bloqueOrigenId = active.data.current?.bloqueId as string | undefined;
    const bloqueDestinoId = (
      String(over.id).startsWith("bloque:")
        ? String(over.id).replace("bloque:", "")
        : over.data.current?.bloqueId
    ) as string | undefined;

    if (!bloqueOrigenId || !bloqueDestinoId) return;

    setRutina((actual) => {
      const bloqueOrigen = actual.bloques.find(
        (bloque) => bloque.id === bloqueOrigenId,
      );
      const bloqueDestino = actual.bloques.find(
        (bloque) => bloque.id === bloqueDestinoId,
      );
      if (!bloqueOrigen || !bloqueDestino) return actual;

      const indiceOrigen = bloqueOrigen.ejercicios.findIndex(
        (item) => item.id === active.id,
      );
      if (indiceOrigen < 0) return actual;

      if (bloqueOrigenId === bloqueDestinoId) {
        const indiceDestino = String(over.id).startsWith("bloque:")
          ? bloqueOrigen.ejercicios.length - 1
          : bloqueOrigen.ejercicios.findIndex((item) => item.id === over.id);
        if (indiceDestino < 0 || indiceDestino === indiceOrigen) return actual;
        return {
          ...actual,
          bloques: actual.bloques.map((bloque) =>
            bloque.id === bloqueOrigenId
              ? {
                  ...bloque,
                  ejercicios: arrayMove(
                    bloque.ejercicios,
                    indiceOrigen,
                    indiceDestino,
                  ),
                }
              : bloque,
          ),
        };
      }

      const itemMovido = bloqueOrigen.ejercicios[indiceOrigen];
      const indiceDestino = String(over.id).startsWith("bloque:")
        ? bloqueDestino.ejercicios.length
        : Math.max(
            0,
            bloqueDestino.ejercicios.findIndex((item) => item.id === over.id),
          );

      return {
        ...actual,
        bloques: actual.bloques.map((bloque) => {
          if (bloque.id === bloqueOrigenId) {
            return {
              ...bloque,
              ejercicios: bloque.ejercicios.filter(
                (item) => item.id !== active.id,
              ),
            };
          }
          if (bloque.id === bloqueDestinoId) {
            const ejercicios = [...bloque.ejercicios];
            ejercicios.splice(indiceDestino, 0, itemMovido);
            return { ...bloque, ejercicios };
          }
          return bloque;
        }),
      };
    });
    setBloqueAbierto(bloqueDestinoId);
  }

  function crearYEditar(rutinaNueva: Rutina) {
    onCreateRutina(rutinaNueva);
    setBloqueAbierto(rutinaNueva.bloques[0].id);
  }

  return (
    <div
      id="inicio-entrenador"
      className="mx-auto max-w-[1600px] scroll-mt-24 px-4 py-7 md:px-8 md:py-10 xl:px-10 xl:py-12"
    >
      {vista === "resumen" && (
        <section>
          <div className="mb-8">
            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200/60">
              Workspace de entrenamiento
            </div>
            <h1 className="max-w-2xl text-3xl font-light tracking-[-0.035em] md:text-4xl xl:max-w-none xl:whitespace-nowrap xl:text-5xl">
              Planificá el progreso de tus atletas
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/35 xl:max-w-none xl:whitespace-nowrap xl:text-base">
              Organizá atletas, reutilizá plantillas y personalizá cada plan desde
              sus espacios dedicados.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [atletas.length, "Atletas", "Gestioná sus perfiles"],
              [plantillas.length, "Plantillas propias", "Reutilizables"],
              [rutinasPorAtleta.length, "Planes asignados", "En todos tus atletas"],
            ].map(([cantidad, titulo, detalle]) => (
              <div
                key={titulo as string}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-4"
              >
                <div className="text-2xl font-light">{cantidad as number}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-white/45">
                  {titulo as string}
                </div>
                <div className="mt-1 text-[10px] text-white/25">
                  {detalle as string}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {vista === "atletas" && !detalleAtleta && (
        <section className="rounded-3xl border border-white/[0.07] bg-[#0d0e13]/70 p-4 md:p-5 xl:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Tus atletas</div>
              <div className="mt-1 text-xs text-white/30">
                Revisá la carga y accedé a la planificación individual.
              </div>
            </div>
            <DialogoNuevoAtleta usuarios={usuarios} onCreate={onCreateAtleta} />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {atletas.map((item) => {
              const planes = rutinasPorAtleta.filter(
                (rutinaActual) => rutinaActual.atletaId === item.id,
              );
              const ejercicios = planes.reduce(
                (total, rutinaActual) =>
                  total + cantidadEjercicios(rutinaActual),
                0,
              );

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-xs text-white">
                        {item.nombre.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{item.nombre}</div>
                      <div className="truncate text-[10px] text-white/30">{item.email}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white/[0.035] px-3 py-2">
                      <div className="text-sm">{planes.length}</div>
                      <div className="text-[9px] uppercase tracking-wider text-white/30">
                        Planes
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/[0.035] px-3 py-2">
                      <div className="text-sm">{ejercicios}</div>
                      <div className="text-[9px] uppercase tracking-wider text-white/30">
                        Ejercicios
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/entrenador/atletas/${item.id}`}
                    onClick={() => onSelectAtleta(item.id)}
                    className="mt-4 flex h-9 items-center justify-center gap-2 rounded-full bg-cyan-300 text-xs font-medium text-indigo-950 transition-colors hover:bg-cyan-200"
                  >
                    Ver planificación
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {vista === "rutinas" && (
        <section className="rounded-3xl border border-white/[0.07] bg-[#0d0e13]/70 p-4 md:p-5 xl:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
            <div className="text-sm font-medium">Biblioteca de plantillas</div>
          <div className="mt-1 text-xs leading-relaxed text-white/30 xl:whitespace-nowrap">
              Guardá la rutina abierta como plantilla para reutilizar su estructura y pesos base. Cada asignación crea una copia independiente para el atleta.
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => onSaveAsTemplate(rutina)}
            className="self-start shrink-0 rounded-full border-indigo-200/10 bg-indigo-300/[0.05] text-white hover:bg-indigo-300/10 hover:text-white xl:self-auto"
          >
            <Plus />
            Guardar como plantilla
          </Button>
        </div>
        {plantillas.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-5 text-xs text-white/35">
            Todavía no tenés plantillas. Personalizá una rutina y guardala acá
            para asignarla rápidamente.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plantillas.map((plantilla) => (
              <div
                key={plantilla.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {plantilla.titulo}
                    </div>
                  </div>
                  <Badge className="shrink-0 border-white/[0.08] bg-white/[0.04] text-[9px] text-white/45">
                    Plantilla
                  </Badge>
                </div>
                <div className="mt-2 text-[10px] text-white/30">
                  {cantidadEjercicios(plantilla)} ejercicios ·{" "}
                  {plantilla.duracion} min
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <DialogoAsignarPlantilla
                    plantilla={plantilla}
                    atletas={atletas}
                    onAssign={(atletaId) =>
                      navegar(() => onAssignTemplate(plantilla.id, atletaId))
                    }
                  />
                  <Dialog>
                    <DialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Eliminar plantilla ${plantilla.titulo}`}
                          className="rounded-full text-white/35 hover:bg-red-400/10 hover:text-red-200"
                        />
                      }
                    >
                      <Trash2 />
                    </DialogTrigger>
                    <DialogContent className="border-white/10 bg-[#111217] text-white">
                      <DialogHeader>
                        <DialogTitle>
                          ¿Eliminar “{plantilla.titulo}”?
                        </DialogTitle>
                        <DialogDescription className="text-white/40">
                          La plantilla dejará de estar disponible para nuevas
                          asignaciones. Las rutinas que ya asignaste no se
                          modificarán.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose
                          render={
                            <Button variant="ghost" className="text-white/50" />
                          }
                        >
                          Cancelar
                        </DialogClose>
                        <DialogClose
                          render={
                            <Button
                              variant="destructive"
                              onClick={() => onDeleteTemplate(plantilla.id)}
                              className="bg-red-500 text-white hover:bg-red-400"
                            />
                          }
                        >
                          Eliminar plantilla
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
        </section>
      )}

      {detalleAtleta && (
        <section id="rutinas-entrenador" className="scroll-mt-24">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/entrenador/atletas"
              className="mb-3 inline-flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-3.5" />
              Todos los atletas
            </Link>
            <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200/60">
              Planificación de {atleta.nombre}
            </div>
            <h2 className="text-2xl font-light tracking-tight md:text-3xl">
              Plan de entrenamiento
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 xl:flex">
              <Avatar className="size-8">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-[10px] text-white">
                  {atleta.nombre.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="max-w-32 truncate text-xs font-medium">
                  {atleta.nombre}
                </div>
                <div className="text-[9px] text-white/30">
                  {rutinas.length} planes · {cantidadEjercicios(rutina)} ejercicios
                </div>
              </div>
            </div>
            <DialogoNuevaRutina atleta={atleta} onCreate={crearYEditar} />
            <Button
              onClick={() => navegar(verComoAtleta)}
              className="rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
            >
              Vista atleta
              <ArrowRight />
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-6">
          <div className="xl:sticky xl:top-24">
            <div className="mb-3 hidden items-center justify-between xl:flex">
              <span className="text-xs font-medium text-white/60">
                Rutinas asignadas
              </span>
              <span className="text-[10px] text-white/25">
                {rutinas.length} planes
              </span>
            </div>
            <SelectorRutina
              rutinas={rutinas}
              rutinaActiva={rutina}
              onSelect={(id) => navegar(() => onSelect(id))}
              desktopVertical
            />
          </div>

          <Card className="overflow-hidden border-white/[0.08] bg-[#0f1015] text-white shadow-[0_24px_70px_rgba(37,28,100,.18)]">
            <CardHeader className="border-b border-indigo-200/[0.07] p-4 md:p-5 xl:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-medium xl:text-xl">
                    {rutina.titulo}
                  </div>
                  <p className="mt-1 text-[11px] text-indigo-100/35 xl:text-xs">
                    {rutina.objetivo} · {rutina.duracion} min ·{" "}
                    {totalSeries(rutina)} series
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "hidden text-[10px] sm:block",
                      hayCambios ? "text-amber-200/70" : "text-cyan-200/55",
                    )}
                  >
                    {hayCambios
                      ? "Cambios sin guardar"
                      : guardadoVisible
                        ? "Cambios guardados"
                        : "Guardado"}
                  </div>
                  <DialogoDetallesRutina
                        rutina={rutina}
                        onUpdate={setRutina}
                  />
                  <Button
                    onClick={guardar}
                    disabled={!hayCambios}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-[0_10px_30px_rgba(79,70,229,.2)] hover:brightness-110 disabled:bg-white/[0.06] disabled:text-white/25 disabled:shadow-none"
                  >
                    <Check />
                    Guardar
                  </Button>
                  <DialogoEjercicio
                    key={rutina.id}
                    bloques={rutina.bloques}
                    onAdd={agregarEjercicio}
                  />
                  <Dialog>
                    <DialogTrigger
                      disabled={rutinas.length <= 1}
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar rutina"
                          title={
                            rutinas.length <= 1
                              ? "Creá otra rutina antes de eliminar esta"
                              : "Eliminar rutina"
                          }
                          className="rounded-full text-white/25 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-20"
                        />
                      }
                    >
                      <Trash2 />
                    </DialogTrigger>
                    <DialogContent className="border-white/10 bg-[#111217] text-white">
                      <DialogHeader>
                        <DialogTitle>¿Eliminar “{rutina.titulo}”?</DialogTitle>
                        <DialogDescription className="text-white/40">
                          La rutina dejará de estar disponible para{" "}
                          {atleta.nombre}. También se quitarán sus entrenamientos
                          programados. Esta acción no se puede deshacer.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose
                          render={
                            <Button variant="ghost" className="text-white/50" />
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
            </CardHeader>
            <CardContent className="p-0">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={moverEjercicio}
              >
                {rutina.bloques.map((bloque, index) => (
                  <BloqueEditor
                    key={bloque.id}
                    bloque={bloque}
                    index={index}
                    abierto={bloqueAbierto === bloque.id}
                    onToggle={() =>
                      setBloqueAbierto((actual) =>
                        actual === bloque.id ? null : bloque.id,
                      )
                    }
                  >
                    {bloque.ejercicios.map((item) => (
                      <FilaEjercicio
                        key={item.id}
                        item={item}
                        bloqueId={bloque.id}
                        onUpdate={(siguiente) =>
                          actualizarEjercicio(bloque.id, item.id, siguiente)
                        }
                        onDelete={() => eliminarEjercicio(bloque.id, item.id)}
                      />
                    ))}
                  </BloqueEditor>
                ))}
              </DndContext>
            </CardContent>
          </Card>
        </div>
        <AgendaDeportiva
          embedded
          modoCoach
          atleta={atleta}
          usuarioActual={entrenador}
          rutinas={rutinas}
          entrenamientos={entrenamientos}
          onCreate={onCreateEntrenamiento}
          onUpdate={onUpdateEntrenamiento}
          onDelete={onDeleteEntrenamiento}
          onStart={() => undefined}
        />
        </section>
      )}

      <Dialog
        open={Boolean(accionPendiente)}
        onOpenChange={(open) => {
          if (!open) setAccionPendiente(null);
        }}
      >
        <DialogContent className="border-white/10 bg-[#111217] text-white">
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

function OverviewRutina({ rutina }: { rutina: Rutina }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full border border-white/10 bg-black/20 text-[10px] text-white/60 hover:bg-white/[0.08] hover:text-white"
          />
        }
      >
        <Route className="size-3.5" />
        Vista general
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden border-white/10 bg-[#0d0e13] p-0 text-white sm:max-w-3xl">
        <DialogHeader className="border-b border-white/[0.07] p-5 pr-12 md:p-6">
          <div className="flex items-center gap-2">
            <Badge className="border-cyan-200/15 bg-cyan-300/10 text-[9px] text-cyan-100">
              Rutina RTTP
            </Badge>
            <span className="text-[9px] uppercase tracking-wider text-white/25">
              Próxima rutina
            </span>
          </div>
          <DialogTitle className="mt-2 text-2xl font-light tracking-tight">
            {rutina.titulo}
          </DialogTitle>
          <DialogDescription className="text-white/40">
            {rutina.bloques.length} bloques conectados · {totalSeries(rutina)}{" "}
            series · {rutina.duracion} min
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(88vh-9rem)] overflow-y-auto px-4 py-6 md:px-8">
          <div className="relative before:absolute before:bottom-5 before:left-[19px] before:top-5 before:w-px before:bg-gradient-to-b before:from-cyan-300/60 before:via-violet-400/45 before:to-blue-400/25 md:before:left-1/2">
            {rutina.bloques.map((bloque, index) => (
              <div
                key={bloque.id}
                className="relative mb-5 flex items-start gap-3 last:mb-0 md:grid md:grid-cols-[1fr_44px_1fr] md:gap-5"
              >
                <div
                  className={cn(
                    "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border text-[10px] font-semibold text-black md:col-start-2 md:row-start-1",
                    index % 2 === 0
                      ? "border-cyan-100/40 bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,.18)]"
                      : "border-violet-100/40 bg-violet-300 shadow-[0_0_24px_rgba(139,92,246,.18)]",
                  )}
                >
                  {index + 1}
                </div>

                <div
                  className={cn(
                    "min-w-0 flex-1 rounded-2xl border p-4 md:row-start-1",
                    index % 2 === 0
                      ? "border-blue-300/15 bg-blue-400/[0.055] md:col-start-1"
                      : "border-violet-300/15 bg-violet-400/[0.055] md:col-start-3",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-white/30">
                        Bloque {index + 1}
                      </div>
                      <h3 className="mt-1 text-sm font-medium">
                        {bloque.nombre}
                      </h3>
                    </div>
                    <Badge className="border-white/10 bg-black/25 text-[8px] text-white/45">
                      {rondasDelBloque(bloque)} ronda
                      {rondasDelBloque(bloque) === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2 border-t border-white/[0.07] pt-3">
                    {bloque.ejercicios.map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-white/30" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-[11px] text-white/75">
                              {item.nombre}
                            </span>
                            <span className="shrink-0 text-[9px] tabular-nums text-white/35">
                              {item.series}×{repeticionesObjetivo(item)}
                              {item.peso > 0 ? ` · ${item.peso} kg` : ""}
                              {item.descanso !== null
                                ? ` · ${item.descanso} s`
                                : ""}
                            </span>
                          </div>
                          {item.aclaraciones && (
                            <div className="mt-0.5 truncate text-[9px] text-violet-200/40">
                              {item.aclaraciones}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-[9px] uppercase tracking-[0.16em] text-white/35">
            <Check className="size-3 text-cyan-200" />
            Fin de la rutina
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HomeAtleta({
  atleta,
  rutinas,
  rutina,
  onSelect,
  onStart,
  progreso,
  onReset,
}: {
  atleta: Usuario;
  rutinas: Rutina[];
  rutina: Rutina;
  onSelect: (id: string) => void;
  onStart: () => void;
  progreso: number;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-9 xl:px-10 xl:py-12">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs text-white/40">Planes asignados</div>
          <h1 className="mt-0.5 text-2xl font-light">Todas tus rutinas</h1>
        </div>
        <Avatar className="size-10 border border-violet-200/15">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-xs text-white">
            {atleta.nombre.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-6">
        <aside className="xl:sticky xl:top-24">
          <div className="mb-3 hidden items-center justify-between xl:flex">
            <span className="text-xs font-medium text-white/60">
              Tus rutinas
            </span>
            <span className="text-[10px] text-white/25">
              {rutinas.length} planes
            </span>
          </div>
          <SelectorRutina
            rutinas={rutinas}
            rutinaActiva={rutina}
            onSelect={onSelect}
            desktopVertical
          />
        </aside>

      <Card className="relative overflow-hidden border-white/[0.09] bg-[#101116] text-white shadow-[0_30px_80px_rgba(0,0,0,.45)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(34,211,238,.18),transparent_35%),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.18),transparent_42%)]" />
        <CardContent className="relative p-5 md:p-7">
          <div className="flex items-center justify-between">
            <Badge className="border-cyan-200/15 bg-cyan-300/10 text-[9px] text-cyan-100">
              Rutina RTTP
            </Badge>
            <OverviewRutina rutina={rutina} />
          </div>
          <div className="mt-10 md:mt-12">
            <h2 className="text-3xl font-light tracking-[-0.04em] md:text-4xl">
              {rutina.titulo}
            </h2>
            <p className="mt-2 text-xs text-indigo-100/40">
              {rutina.objetivo}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                [Clock3, `${rutina.duracion} min`],
                [Zap, `${totalSeries(rutina)} series`],
                [LayoutGrid, `${rutina.bloques.length} bloques`],
              ].map(([Icon, value]) => {
                const InfoIcon = Icon as typeof Clock3;
                return (
                  <div
                    key={value as string}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[10px] text-white/70"
                  >
                    <InfoIcon className="size-3 text-cyan-200" />
                    {value as string}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-col items-stretch gap-2 sm:items-start">
              <Button
                onClick={onStart}
                className="h-12 w-full rounded-full bg-indigo-50 text-indigo-950 hover:bg-cyan-100 sm:w-auto sm:px-8"
              >
                {progreso ? "Continuar rutina" : "Comenzar rutina"}
                <ArrowRight />
              </Button>
              {progreso > 0 && (
                <Dialog>
                  <DialogTrigger
                    render={
                      <button className="mx-auto text-[10px] text-white/30 transition-colors hover:text-white/70 sm:mx-0 sm:pl-4" />
                    }
                  >
                    Reiniciar progreso
                  </DialogTrigger>
                  <DialogContent className="border-white/10 bg-[#111217] text-white">
                    <DialogHeader>
                      <DialogTitle>¿Reiniciar esta rutina?</DialogTitle>
                      <DialogDescription className="text-white/45">
                        Se eliminarán todas las series registradas de esta
                        rutina. Esta acción no se puede deshacer.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose
                        render={
                          <Button variant="ghost" className="text-white/50" />
                        }
                      >
                        Cancelar
                      </DialogClose>
                      <DialogClose
                        render={
                          <Button
                            variant="destructive"
                            onClick={onReset}
                            className="bg-red-500 text-white hover:bg-red-400"
                          />
                        }
                      >
                        Sí, reiniciar
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function HomeHoy({
  atleta,
  rutinas,
  entrenamientos,
  onStart,
}: {
  atleta: Usuario;
  rutinas: Rutina[];
  entrenamientos: EntrenamientoProgramado[];
  onStart: (item: EntrenamientoProgramado) => void;
}) {
  const hoy = fechaLocal();
  const fechaLegible = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${hoy}T12:00:00`));
  const rutinasDeHoy = entrenamientos
    .filter(
      (item) =>
        item.fecha === hoy &&
        item.origen === "rutina" &&
        item.estado !== "omitido",
    )
    .sort((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""));

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 md:px-8 md:py-10 xl:px-10 xl:py-12">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <div className="text-xs text-white/40">Hola, {atleta.nombre}</div>
          <h1 className="mt-1 text-3xl font-light tracking-[-0.035em] md:text-4xl">
            Tu entrenamiento de hoy
          </h1>
          <p className="mt-2 text-xs capitalize text-white/30">
            {fechaLegible}
          </p>
        </div>
        <Avatar className="size-11 border border-violet-200/15">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-xs text-white">
            {atleta.nombre.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      </div>

      {rutinasDeHoy.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {rutinasDeHoy.map((entrenamiento) => {
            const rutina = rutinas.find(
              (item) =>
                entrenamiento.origen === "rutina" &&
                item.id === entrenamiento.rutinaId,
            );
            if (!rutina) return null;
            const completada = entrenamiento.estado === "completado";

            return (
              <Card
                key={entrenamiento.id}
                className="relative overflow-hidden border-white/[0.09] bg-[#101116] text-white shadow-[0_24px_70px_rgba(0,0,0,.35)]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,.15),transparent_38%),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.13),transparent_45%)]" />
                <CardContent className="relative p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] text-cyan-100/55">
                        {entrenamiento.hora && (
                          <>
                            <Clock3 className="size-3" />
                            <span>{entrenamiento.hora}</span>
                          </>
                        )}
                      </div>
                      <h2 className="mt-4 text-2xl font-light tracking-[-0.03em]">
                        {rutina.titulo}
                      </h2>
                      <p className="mt-2 text-xs leading-relaxed text-white/35">
                        {rutina.objetivo}
                      </p>
                    </div>
                    {completada && (
                      <Badge className="shrink-0 border-emerald-200/10 bg-emerald-300/10 text-[9px] text-emerald-200">
                        <CheckCircle2 />
                        Completada
                      </Badge>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/25 px-3 py-2 text-[10px] text-white/55">
                      <Clock3 className="size-3 text-cyan-200" />
                      {entrenamiento.duracionMinutos} min
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/25 px-3 py-2 text-[10px] text-white/55">
                      <Zap className="size-3 text-violet-200" />
                      {totalSeries(rutina)} series
                    </div>
                  </div>

                  {!completada && (
                    <Button
                      onClick={() => onStart(entrenamiento)}
                      className="mt-6 h-11 w-full rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200 sm:w-auto sm:px-7"
                    >
                      {entrenamiento.estado === "en-curso"
                        ? "Continuar rutina"
                        : "Comenzar rutina"}
                      <ArrowRight />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-white/[0.09] bg-white/[0.02] px-6 text-center">
          <div>
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-cyan-300/[0.08] text-cyan-100/55">
              <CalendarDays className="size-5" />
            </div>
            <h2 className="mt-4 text-lg font-medium">
              No tenés rutinas para hoy
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-white/35">
              Podés descansar, revisar tu semana o programar una rutina desde la
              agenda.
            </p>
            <Link
              href="/agenda"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-cyan-300 px-5 text-xs font-medium text-indigo-950 transition-colors hover:bg-cyan-200"
            >
              Ver agenda
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function CampoPrescripcion({
  label,
  hint,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.09] bg-black/30 p-3 text-center">
      <div className="text-[9px] uppercase tracking-[0.16em] text-indigo-100/35">
        {label}
      </div>
      <div className="mt-2 flex items-center justify-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Reducir ${label.toLowerCase()}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onChange(Math.max(0, value - step))}
          className="size-8 rounded-full bg-white/[0.04] text-white/45 hover:bg-white/[0.09] hover:text-white"
        >
          <Minus />
        </Button>
        <Input
          aria-label={label}
          type="number"
          inputMode={step < 1 ? "decimal" : "numeric"}
          min={0}
          step={step}
          value={value}
          onChange={(event) =>
            onChange(Math.max(0, Number(event.target.value)))
          }
          onPointerDown={(event) => event.stopPropagation()}
          className="h-10 w-16 border-0 bg-transparent p-0 text-center text-2xl font-light tabular-nums text-white shadow-none [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onChange(value + step)}
          className="size-8 rounded-full bg-white/[0.04] text-white/45 hover:bg-white/[0.09] hover:text-white"
        >
          <Plus />
        </Button>
      </div>
      <div className="mt-1 text-[8px] uppercase tracking-[0.12em] text-white/20">
        {hint}
      </div>
    </div>
  );
}

function WorkoutMode({
  rutina,
  sesionId,
  registros,
  setRegistros,
  indiceActivo,
  setIndiceActivo,
  onExit,
  onFinish,
}: {
  rutina: Rutina;
  sesionId: string;
  registros: Record<string, RegistroSerie>;
  setRegistros: React.Dispatch<
    React.SetStateAction<Record<string, RegistroSerie>>
  >;
  indiceActivo: number;
  setIndiceActivo: React.Dispatch<React.SetStateAction<number>>;
  onExit: () => void;
  onFinish: () => void;
}) {
  const pasos = pasosDeRutina(rutina, sesionId);
  const paso = pasos[indiceActivo];
  const bloque = rutina.bloques[paso.bloqueIndex];
  const proximo = pasos[indiceActivo + 1];
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [vistaCalentamiento, setVistaCalentamiento] = useState<
    "resumida" | "tarjetas"
  >("resumida");
  const inicioPointer = useRef<number | null>(null);
  const distanciaPointer = useRef(0);
  const esBloqueBreve =
    bloque.ejercicios.length > 1 &&
    (bloque.tipo.includes("Preparación") ||
      bloque.tipo.includes("Circuito") ||
      /entrada|activación|movilidad/i.test(bloque.nombre));

  const valorInicial: RegistroSerie = {
    peso: paso.peso,
    repeticiones: paso.repeticionesMin,
    completada: false,
    omitida: false,
  };
  const registro = registros[paso.pasoId] ?? valorInicial;

  function actualizar(patch: Partial<RegistroSerie>) {
    setRegistros((actuales) => ({
      ...actuales,
      [paso.pasoId]: {
        ...(actuales[paso.pasoId] ?? valorInicial),
        ...patch,
      },
    }));
  }

  function avanzar() {
    setDragX(0);
    let siguiente = indiceActivo + 1;
    while (
      siguiente < pasos.length &&
      registros[pasos[siguiente].pasoId]?.omitida
    ) {
      siguiente += 1;
    }

    if (siguiente >= pasos.length) {
      onFinish();
    } else {
      setIndiceActivo(siguiente);
    }
  }

  function omitir(alcance: "serie" | "ejercicio" | "bloque") {
    const objetivos = pasos.filter((item, index) => {
      if (index < indiceActivo) return false;
      if (alcance === "serie") return index === indiceActivo;
      if (alcance === "ejercicio") return item.id === paso.id;
      return item.bloqueId === paso.bloqueId;
    });
    const idsOmitidos = new Set(objetivos.map((item) => item.pasoId));

    setRegistros((actuales) => {
      const siguientes = { ...actuales };
      objetivos.forEach((item) => {
        const existente = actuales[item.pasoId];
        siguientes[item.pasoId] = existente
          ? { ...existente, completada: false, omitida: true }
          : {
              peso: item.peso,
              repeticiones: item.repeticionesMin,
              completada: false,
              omitida: true,
            };
      });
      return siguientes;
    });

    let siguiente = indiceActivo + 1;
    while (
      siguiente < pasos.length &&
      (idsOmitidos.has(pasos[siguiente].pasoId) ||
        registros[pasos[siguiente].pasoId]?.omitida)
    ) {
      siguiente += 1;
    }

    if (siguiente >= pasos.length) {
      onFinish();
    } else {
      setIndiceActivo(siguiente);
    }
    setDragX(0);
  }

  function volver() {
    setDragX(0);
    setIndiceActivo((indice) => Math.max(0, indice - 1));
  }

  function completarRondaResumida() {
    const objetivos = pasos.filter(
      (item) =>
        item.bloqueId === paso.bloqueId && item.ronda === paso.ronda,
    );
    const ids = new Set(objetivos.map((item) => item.pasoId));

    setRegistros((actuales) => {
      const siguientes = { ...actuales };
      objetivos.forEach((item) => {
        siguientes[item.pasoId] = {
          peso: actuales[item.pasoId]?.peso ?? item.peso,
          repeticiones:
            actuales[item.pasoId]?.repeticiones ?? item.repeticionesMin,
          completada: true,
          omitida: false,
        };
      });
      return siguientes;
    });

    const ultimoIndice = pasos.reduce(
      (ultimo, item, index) => (ids.has(item.pasoId) ? index : ultimo),
      indiceActivo,
    );
    if (ultimoIndice >= pasos.length - 1) {
      onFinish();
    } else {
      setIndiceActivo(ultimoIndice + 1);
    }
  }

  function esInteractivo(target: EventTarget) {
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest("button, input, textarea, a"))
    );
  }

  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (esInteractivo(event.target)) return;
    inicioPointer.current = event.clientX;
    distanciaPointer.current = 0;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (inicioPointer.current === null) return;
    const distancia = event.clientX - inicioPointer.current;
    distanciaPointer.current = distancia;
    setDragX(Math.max(-150, Math.min(150, distancia)));
  }

  function pointerUp() {
    if (inicioPointer.current === null) return;
    const distancia = distanciaPointer.current;
    inicioPointer.current = null;
    distanciaPointer.current = 0;
    setDragging(false);

    if (distancia < -80) {
      if (registro.completada || registro.omitida) {
        avanzar();
      } else {
        setMensaje("Primero completá la serie");
        window.setTimeout(() => setMensaje(""), 1600);
        setDragX(0);
      }
      return;
    }

    if (distancia > 80 && indiceActivo > 0) {
      volver();
      return;
    }

    setDragX(0);
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-4.5rem)] max-w-7xl flex-col overflow-hidden px-4 py-3 md:px-8 md:py-5 xl:px-10">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="rounded-full border border-indigo-200/10 text-indigo-100/55 hover:bg-indigo-300/10 hover:text-white"
          >
            <ArrowLeft />
          </Button>
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-[0.18em] text-cyan-200/65">
              Rutina en curso
            </div>
            <div className="mt-1 text-[10px] text-indigo-100/35">
              Bloque {paso.bloqueIndex + 1} de {rutina.bloques.length}
            </div>
          </div>
          <div className="size-9" />
        </div>
        <Progress
          value={(paso.bloqueIndex / rutina.bloques.length) * 100}
          className="h-1 bg-indigo-300/10"
        />
      </div>

      <div className="mx-auto mt-3 w-full max-w-lg xl:max-w-4xl">
        {esBloqueBreve && (
          <div className="mb-3 flex items-center justify-between rounded-full border border-white/[0.08] bg-white/[0.025] p-1 pl-3">
            <span className="text-[8px] uppercase tracking-[0.16em] text-white/30">
              Prueba de vista
            </span>
            <div className="flex gap-1">
              {[
                {
                  vista: "resumida" as const,
                  Icon: ListChecks,
                  label: "Vista rápida",
                },
                {
                  vista: "tarjetas" as const,
                  Icon: LayoutGrid,
                  label: "Tarjetas",
                },
              ].map(({ vista, Icon, label }) => (
                <button
                  key={vista}
                  onClick={() => setVistaCalentamiento(vista)}
                  aria-pressed={vistaCalentamiento === vista}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-2 text-[9px] transition-colors",
                    vistaCalentamiento === vista
                      ? "bg-indigo-50 text-indigo-950"
                      : "text-white/35 hover:text-white/65",
                  )}
                >
                  <Icon className="size-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <Badge className="border-violet-200/15 bg-violet-300/10 text-[9px] text-violet-100">
              {paso.bloqueNombre}
            </Badge>
            <span className="ml-2 text-[9px] text-indigo-100/30">
              Ronda {paso.ronda}/{paso.rondas}
            </span>
          </div>
          <div
            className={cn(
              "flex gap-1.5",
              esBloqueBreve &&
                vistaCalentamiento === "resumida" &&
                "hidden",
            )}
          >
            {bloque.ejercicios.map((item, index) => (
              <span
                key={item.id}
                className={cn(
                  "h-1.5 rounded-full",
                  index === paso.posicion
                    ? "w-6 bg-cyan-300"
                    : "w-1.5 bg-indigo-200/15",
                )}
              />
            ))}
          </div>
        </div>

        {esBloqueBreve && vistaCalentamiento === "resumida" ? (
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-200/[0.14] bg-[#101116] p-5 shadow-[0_30px_80px_rgba(0,0,0,.5)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_0%,rgba(34,211,238,.14),transparent_37%),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.15),transparent_42%)]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.16em] text-cyan-200/55">
                    Vista rápida
                  </div>
                  <h1 className="mt-2 text-2xl font-light tracking-[-0.035em]">
                    Toda la vuelta, de un vistazo
                  </h1>
                  <p className="mt-1 text-[10px] text-white/35">
                    {bloque.ejercicios.length} ejercicios · vuelta {paso.ronda}{" "}
                    de {paso.rondas}
                  </p>
                </div>
                <div className="grid size-10 shrink-0 place-items-center rounded-full border border-cyan-200/15 bg-cyan-300/10 text-cyan-200">
                  <ListChecks className="size-4" />
                </div>
              </div>

              <div className="mt-5 divide-y divide-white/[0.07] rounded-2xl border border-white/[0.07] bg-black/20 px-4">
                {bloque.ejercicios.map((item, index) => {
                  const pasoDeRonda = pasos.find(
                    (candidato) =>
                      candidato.bloqueId === paso.bloqueId &&
                      candidato.ronda === paso.ronda &&
                      candidato.id === item.id,
                  );
                  const completado = pasoDeRonda
                    ? registros[pasoDeRonda.pasoId]?.completada
                    : false;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <div
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full border text-[9px]",
                          completado
                            ? "border-cyan-200/20 bg-cyan-300 text-indigo-950"
                            : "border-white/10 bg-white/[0.035] text-white/40",
                        )}
                      >
                        {completado ? <Check className="size-3" /> : index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs text-white/80">
                          {item.nombre}
                        </div>
                        {item.aclaraciones && (
                          <div className="mt-0.5 truncate text-[9px] text-violet-200/40">
                            {item.aclaraciones}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-[10px] tabular-nums text-white/40">
                        {item.series}×{repeticionesObjetivo(item)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={completarRondaResumida}
                className="mt-5 h-12 w-full rounded-full bg-indigo-50 text-indigo-950 hover:bg-cyan-100"
              >
                <Check />
                {paso.ronda === paso.rondas
                  ? "Completar calentamiento"
                  : `Completar vuelta ${paso.ronda}`}
              </Button>
              <button
                onClick={() => omitir("bloque")}
                className="mt-3 w-full text-center text-[10px] text-white/30 transition-colors hover:text-white/60"
              >
                Saltar este bloque
              </button>
            </div>
          </div>
        ) : (
          <>
        <div className="relative min-h-[445px]">
          {pasos[indiceActivo + 2] && (
            <div className="absolute inset-x-8 top-4 h-[425px] rounded-[2rem] border border-blue-200/[0.06] bg-blue-300/[0.025]" />
          )}
          {proximo && (
            <div className="absolute inset-x-4 top-2 h-[425px] rounded-[2rem] border border-violet-200/[0.09] bg-violet-300/[0.045]" />
          )}
          <div
            role="group"
            aria-label={`${paso.nombre}, ronda ${paso.ronda}`}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={() => {
              inicioPointer.current = null;
              setDragging(false);
              setDragX(0);
            }}
            className={cn(
              "relative z-10 min-h-[425px] select-none overflow-hidden rounded-[2rem] border bg-[#101116] p-4 shadow-[0_30px_80px_rgba(0,0,0,.5)] md:p-5",
              registro.completada
                ? "border-cyan-300/30"
                : registro.omitida
                  ? "border-orange-200/20"
                  : "border-violet-200/[0.12]",
              !dragging && "transition-transform duration-200",
            )}
            style={{
              touchAction: "pan-y",
              transform: `translateX(${dragX}px) rotate(${dragX / 28}deg)`,
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_0%,rgba(34,211,238,.15),transparent_37%),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.16),transparent_42%)]" />
            <div className="relative flex min-h-[391px] flex-col">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-indigo-100/30">
                    Serie {paso.ronda} de {paso.series}
                  </div>
                  <h1 className="mt-2 text-3xl font-light tracking-[-0.04em]">
                    {paso.nombre}
                  </h1>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Sheet>
                    <SheetTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full border border-white/10 bg-white/[0.035] text-white/45 hover:bg-white/[0.08] hover:text-white"
                          aria-label="Opciones para saltar"
                        />
                      }
                    >
                      <SkipForward />
                    </SheetTrigger>
                    <SheetContent
                      side="bottom"
                      className="mx-auto max-w-lg rounded-t-[2rem] border-white/10 bg-[#111217] pb-6 text-white"
                    >
                      <SheetHeader className="px-5 pt-6">
                        <SheetTitle className="text-white">
                          ¿Qué querés saltar?
                        </SheetTitle>
                        <SheetDescription className="text-white/40">
                          La omisión quedará registrada. Podés volver con
                          Anterior si cambiás de idea.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="space-y-2 px-4">
                        {[
                          {
                            alcance: "serie" as const,
                            icono: SkipForward,
                            titulo: "Saltar esta serie",
                            texto: `Omitir solo la serie ${paso.ronda} de ${paso.nombre}.`,
                          },
                          {
                            alcance: "ejercicio" as const,
                            icono: Dumbbell,
                            titulo: "Saltar ejercicio",
                            texto:
                              "Útil si la máquina está ocupada. Omite sus series restantes.",
                          },
                          {
                            alcance: "bloque" as const,
                            icono: LayoutGrid,
                            titulo: "Saltar bloque",
                            texto:
                              paso.bloqueIndex === rutina.bloques.length - 1
                                ? "Omitir lo restante y finalizar la rutina."
                                : `Pasar directamente al bloque ${paso.bloqueIndex + 2}.`,
                          },
                        ].map((opcion) => (
                          <SheetClose
                            key={opcion.alcance}
                            render={
                              <button
                                onClick={() => omitir(opcion.alcance)}
                                className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition-colors hover:bg-white/[0.06]"
                              />
                            }
                          >
                            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-violet-300/10 text-violet-200">
                              <opcion.icono className="size-4" />
                            </div>
                            <div>
                              <div className="text-sm text-white">
                                {opcion.titulo}
                              </div>
                              <div className="mt-1 text-[10px] leading-relaxed text-white/35">
                                {opcion.texto}
                              </div>
                            </div>
                          </SheetClose>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                  <div
                    className={cn(
                      "grid size-10 place-items-center rounded-full border",
                      registro.completada
                        ? "border-cyan-200/25 bg-cyan-300 text-indigo-950"
                        : registro.omitida
                          ? "border-orange-200/20 bg-orange-300/10 text-orange-200"
                          : "border-indigo-200/10 bg-indigo-300/[0.07] text-indigo-100/30",
                    )}
                  >
                    {registro.completada ? (
                      <Check />
                    ) : registro.omitida ? (
                      <SkipForward />
                    ) : (
                      <Dumbbell />
                    )}
                  </div>
                </div>
              </div>

              {paso.aclaraciones && (
                <div className="mt-3 flex w-full flex-col rounded-xl border border-violet-300/15 bg-violet-300/[0.07] px-3 py-2">
                  <span className="text-[8px] uppercase tracking-[0.14em] text-violet-200/45">
                    Aclaraciones
                  </span>
                  <span className="mt-1 text-[11px] leading-relaxed text-violet-100/70">
                    {paso.aclaraciones}
                  </span>
                </div>
              )}

              {paso.descanso !== null && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-blue-300/15 bg-blue-400/[0.07] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="grid size-8 place-items-center rounded-full bg-blue-300/10 text-blue-200">
                      <TimerReset className="size-3.5" />
                    </div>
                    <div>
                      <div className="text-[8px] uppercase tracking-[0.14em] text-blue-200/45">
                        Descanso
                      </div>
                      <div className="mt-0.5 text-[10px] text-blue-100/60">
                        Entre series
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-light tabular-nums text-blue-100">
                    {paso.descanso}
                    <span className="ml-1 text-[10px] text-blue-100/40">s</span>
                  </div>
                </div>
              )}

              <Separator className="my-3 bg-indigo-200/[0.08]" />

              <div className="grid grid-cols-2 gap-3">
                <CampoPrescripcion
                  label="Repeticiones"
                  hint={`Objetivo ${repeticionesObjetivo(paso)}`}
                  value={registro.repeticiones}
                  onChange={(repeticiones) => actualizar({ repeticiones })}
                />
                <CampoPrescripcion
                  label="Peso"
                  hint="Kilogramos"
                  step={0.5}
                  value={registro.peso}
                  onChange={(peso) => actualizar({ peso })}
                />
              </div>

              <Button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  actualizar({
                    completada: !registro.completada,
                    omitida: false,
                  });
                }}
                className={cn(
                  "mt-auto h-12 w-full rounded-full",
                  registro.completada
                    ? "border border-cyan-200/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"
                    : "bg-indigo-50 text-indigo-950 hover:bg-cyan-100",
                )}
              >
                {registro.completada ? (
                  <>
                    <RotateCcw />
                    Serie completada
                  </>
                ) : (
                  <>
                    <Check />
                    {registro.omitida
                      ? "Registrar esta serie"
                      : "Completar serie"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="-mt-1 text-center">
          <div
            className={cn(
              "h-4 text-[10px] text-orange-200 transition-opacity",
              mensaje ? "opacity-100" : "opacity-0",
            )}
          >
            {mensaje}
          </div>
          <div className="mt-1 flex items-center justify-center gap-2 text-[9px] text-indigo-100/30">
            <MoveHorizontal className="size-3" />
            Deslizá a la izquierda para avanzar
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <Button
            variant="outline"
            disabled={indiceActivo === 0}
            onClick={volver}
            className="h-11 flex-1 rounded-full border-indigo-200/10 bg-indigo-300/[0.04] text-white hover:bg-indigo-300/10 hover:text-white disabled:opacity-20"
          >
            <ArrowLeft />
            Anterior
          </Button>
          <Button
            disabled={!registro.completada && !registro.omitida}
            onClick={avanzar}
            className="h-11 flex-[1.5] rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200 disabled:bg-indigo-300/10 disabled:text-indigo-100/25"
          >
            {indiceActivo === pasos.length - 1 ? "Finalizar" : "Siguiente"}
            <ArrowRight />
          </Button>
        </div>

        <div className="mt-2 flex items-center justify-end rounded-2xl border border-indigo-200/[0.08] bg-indigo-300/[0.04] p-3">
          <div className="max-w-40 truncate text-[10px] text-indigo-100/35">
            Próximo: {proximo?.nombre ?? "Fin"}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

function RutinaCompletada({
  atleta,
  feedback,
  setFeedback,
  onDone,
}: {
  atleta: Usuario;
  feedback: string;
  setFeedback: (value: string) => void;
  onDone: () => void;
}) {
  const [esfuerzo, setEsfuerzo] = useState(4);
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-5xl place-items-center px-4 py-8 md:px-8 xl:px-10">
      <Card className="w-full border-violet-200/[0.12] bg-[#101116] text-center text-white shadow-[0_30px_90px_rgba(0,0,0,.5)]">
        <CardContent className="p-6 md:p-9 xl:grid xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] xl:items-center xl:gap-10 xl:p-12">
          <div>
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-400 text-indigo-950">
            <Trophy className="size-6" />
          </div>
          <h1 className="mt-5 text-3xl font-light">Rutina completada</h1>
          <p className="mt-2 text-xs text-indigo-100/40">
            Excelente trabajo, {atleta.nombre}.
          </p>
          <div className="my-6 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setEsfuerzo(value)}
                aria-label={`Esfuerzo ${value} de 5`}
                className={cn(
                  "grid size-10 place-items-center rounded-full border",
                  value <= esfuerzo
                    ? "border-orange-200/20 bg-orange-300/10 text-orange-300"
                    : "border-indigo-200/10 text-indigo-100/15",
                )}
              >
                <Flame
                  className={cn("size-4", value <= esfuerzo && "fill-current")}
                />
              </button>
            ))}
          </div>
          </div>
          <div className="xl:text-left">
          <Textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="¿Querés contarle algo a tu entrenador?"
            className="min-h-24 border-white/10 bg-black/30 text-white placeholder:text-white/25"
          />
          <Button
            onClick={onDone}
            className="mt-4 h-12 w-full rounded-full bg-indigo-50 text-indigo-950 hover:bg-cyan-100"
          >
            Enviar y cerrar
            <CheckCircle2 />
          </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExperienciaAtleta({
  atleta,
  rutinas,
  rutina,
  entrenamientoInicial,
  onSelect,
  onCreateEntrenamiento,
  onUpdateEntrenamiento,
  onCloseScheduled,
  registros,
  setRegistros,
}: {
  atleta: Usuario;
  rutinas: Rutina[];
  rutina: Rutina;
  entrenamientoInicial?: EntrenamientoProgramado;
  onSelect: (id: string) => void;
  onCreateEntrenamiento: (
    item: NuevoEntrenamientoProgramado,
  ) => EntrenamientoProgramado;
  onUpdateEntrenamiento: (item: EntrenamientoProgramado) => void;
  onCloseScheduled: () => void;
  registros: Record<string, RegistroSerie>;
  setRegistros: React.Dispatch<
    React.SetStateAction<Record<string, RegistroSerie>>
  >;
}) {
  const [pantalla, setPantalla] = useState<"home" | "workout" | "final">(
    entrenamientoInicial ? "workout" : "home",
  );
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [entrenamiento, setEntrenamiento] = useState<
    EntrenamientoProgramado | undefined
  >(entrenamientoInicial);
  const sesionId = entrenamiento?.id;
  const progreso = Object.entries(registros).filter(
    ([key, value]) => sesionId && key.startsWith(`${sesionId}-`) && value.completada,
  ).length;

  function reset() {
    if (!sesionId) return;
    setRegistros((actuales) =>
      Object.fromEntries(
        Object.entries(actuales).filter(
          ([key]) => !key.startsWith(`${sesionId}-`),
        ),
      ),
    );
    setIndiceActivo(0);
  }

  function iniciar() {
    if (entrenamiento) {
      const enCurso = { ...entrenamiento, estado: "en-curso" as const };
      setEntrenamiento(enCurso);
      onUpdateEntrenamiento(enCurso);
      setPantalla("workout");
      return;
    }

    const creado = onCreateEntrenamiento({
      atletaId: atleta.id,
      fecha: fechaLocal(),
      hora: null,
      duracionMinutos: rutina.duracion,
      estado: "en-curso",
      creadoPorId: atleta.id,
      notas: "",
      origen: "rutina",
      rutinaId: rutina.id,
      titulo: null,
      categoria: null,
    });
    setEntrenamiento(creado);
    setPantalla("workout");
  }

  function cerrarEntrenamiento() {
    if (entrenamientoInicial) {
      onCloseScheduled();
      return;
    }
    setPantalla("home");
  }

  if (pantalla === "workout" && sesionId) {
    return (
      <WorkoutMode
        rutina={rutina}
        sesionId={sesionId}
        registros={registros}
        setRegistros={setRegistros}
        indiceActivo={indiceActivo}
        setIndiceActivo={setIndiceActivo}
        onExit={cerrarEntrenamiento}
        onFinish={() => setPantalla("final")}
      />
    );
  }

  if (pantalla === "final") {
    return (
      <RutinaCompletada
        atleta={atleta}
        feedback={feedback}
        setFeedback={setFeedback}
        onDone={() => {
          if (entrenamiento) {
            const completado = {
              ...entrenamiento,
              estado: "completado" as const,
            };
            setEntrenamiento(completado);
            onUpdateEntrenamiento(completado);
          }
          cerrarEntrenamiento();
        }}
      />
    );
  }

  return (
    <HomeAtleta
      atleta={atleta}
      rutinas={rutinas}
      rutina={rutina}
      onSelect={(id) => {
        onSelect(id);
        setIndiceActivo(0);
        setEntrenamiento(undefined);
      }}
      onStart={iniciar}
      progreso={progreso}
      onReset={reset}
    />
  );
}

export default function Home() {
  const pathname = usePathname();
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciales);
  const [rutinas, setRutinas] = useState<Rutina[]>(rutinasIniciales);
  const [plantillas, setPlantillas] = useState<PlantillaRutina[]>([]);
  const [entrenamientos, setEntrenamientos] = useState<
    EntrenamientoProgramado[]
  >([]);
  const [entrenamientoActivoId, setEntrenamientoActivoId] = useState<
    string | null
  >(null);
  const [rutinaId, setRutinaId] = useState(rutinasIniciales[0].id);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [atletaSeleccionadoId, setAtletaSeleccionadoId] = useState(1);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);
  const [registros, setRegistros] = useState<
    Record<string, RegistroSerie>
  >({});
  const [hidratado, setHidratado] = useState(false);
  const usuario =
    usuarios.find((item) => item.id === usuarioId) ?? null;
  const atletasDelCoach = usuarios.filter(
    (item) =>
      item.rol === "atleta" && usuario?.atletaIds?.includes(item.id),
  );
  const atleta =
    usuario?.rol === "atleta"
      ? usuario
      : atletasDelCoach.find((item) => item.id === atletaSeleccionadoId) ??
        atletasDelCoach[0];
  const rutinasDelAtleta = atleta
    ? rutinas.filter((item) => item.atletaId === atleta.id)
    : [];
  const rutina =
    rutinasDelAtleta.find((item) => item.id === rutinaId) ??
    rutinasDelAtleta[0];
  const entrenamientoActivo = entrenamientos.find(
    (item) => item.id === entrenamientoActivoId,
  );
  const rutinaDeEntrenamiento =
    entrenamientoActivo?.origen === "rutina"
      ? rutinasDelAtleta.find(
          (item) => item.id === entrenamientoActivo.rutinaId,
        ) ?? rutina
      : rutina;
  const atletaRutaId = Number(pathname.split("/").at(-1));
  const detalleAtleta =
    pathname.startsWith("/entrenador/atletas/") &&
    Number.isInteger(atletaRutaId);
  const vistaEntrenador: VistaEntrenador =
    pathname.startsWith("/entrenador/atletas")
      ? "atletas"
      : pathname === "/entrenador/rutinas"
        ? "rutinas"
        : "resumen";
  const vistaAtleta: VistaAtleta =
    pathname === "/agenda"
      ? "agenda"
      : pathname === "/rutinas"
        ? "rutinas"
        : "inicio";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      let usuariosDisponibles = usuariosIniciales;
      const usuariosGuardados = window.localStorage.getItem(usersStorageKey);
      if (usuariosGuardados) {
        try {
          const persistidos = JSON.parse(usuariosGuardados) as Usuario[];
          usuariosDisponibles = [
            ...persistidos,
            ...usuariosIniciales.filter(
              (semilla) =>
                !persistidos.some(
                  (item) =>
                    item.id === semilla.id || item.email === semilla.email,
                ),
            ),
          ];
          setUsuarios(usuariosDisponibles);
        } catch {
          window.localStorage.removeItem(usersStorageKey);
        }
      }
      const guardadas = window.localStorage.getItem(storageKey);
      if (guardadas) {
        try {
          const persistidas = JSON.parse(guardadas) as (Rutina & {
            dia?: string;
          })[];
          setRutinas([
            ...persistidas.map(normalizarRutina),
            ...rutinasIniciales.filter(
              (semilla) =>
                !persistidas.some((item) => item.id === semilla.id),
            ),
          ]);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      const plantillasGuardadas = window.localStorage.getItem(templatesStorageKey);
      if (plantillasGuardadas) {
        try {
          const persistidas = JSON.parse(plantillasGuardadas) as (PlantillaRutina & {
            dia?: string;
          })[];
          setPlantillas(persistidas.map(normalizarPlantilla));
        } catch {
          window.localStorage.removeItem(templatesStorageKey);
        }
      }
      const agendaGuardada = window.localStorage.getItem(agendaStorageKey);
      if (agendaGuardada) {
        try {
          setEntrenamientos(
            JSON.parse(agendaGuardada) as EntrenamientoProgramado[],
          );
        } catch {
          window.localStorage.removeItem(agendaStorageKey);
        }
      }
      const usuarioGuardado = Number(
        window.localStorage.getItem(sessionStorageKey),
      );
      if (usuariosDisponibles.some((item) => item.id === usuarioGuardado)) {
        setUsuarioId(usuarioGuardado);
        const usuarioInicial = usuariosDisponibles.find(
          (item) => item.id === usuarioGuardado,
        );
        const atletaGuardado = Number(
          window.localStorage.getItem(selectedAthleteStorageKey),
        );
        setAtletaSeleccionadoId(
          usuarioInicial?.rol === "atleta"
            ? usuarioInicial.id
            : usuarioInicial?.atletaIds?.includes(atletaRutaId)
              ? atletaRutaId
              : usuarioInicial?.atletaIds?.includes(atletaGuardado)
                ? atletaGuardado
                : usuarioInicial?.atletaIds?.[0] ?? 1,
        );
      }
      setHidratado(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [atletaRutaId]);

  useEffect(() => {
    if (hidratado) {
      window.localStorage.setItem(storageKey, JSON.stringify(rutinas));
      window.localStorage.setItem(usersStorageKey, JSON.stringify(usuarios));
      window.localStorage.setItem(
        templatesStorageKey,
        JSON.stringify(plantillas),
      );
      window.localStorage.setItem(
        agendaStorageKey,
        JSON.stringify(entrenamientos),
      );
    }
  }, [rutinas, usuarios, plantillas, entrenamientos, hidratado]);

  function guardarRutina(rutinaGuardada: Rutina) {
    setRutinas((actuales) =>
      actuales.map((item) =>
        item.id === rutinaGuardada.id ? rutinaGuardada : item,
      ),
    );
  }

  function acceder(email: string) {
    const usuarioEncontrado = usuarios.find(
      (item) => item.email === email.trim().toLowerCase(),
    );
    if (!usuarioEncontrado) return false;

    const atletaId =
      usuarioEncontrado.rol === "atleta"
        ? usuarioEncontrado.id
        : usuarioEncontrado.atletaIds?.[0] ?? 1;
    const primeraRutina = rutinas.find((item) => item.atletaId === atletaId);
    setUsuarioId(usuarioEncontrado.id);
    setAtletaSeleccionadoId(atletaId);
    setRutinaId(primeraRutina?.id ?? rutinasIniciales[0].id);
    setVistaPrevia(false);
    window.localStorage.setItem(
      sessionStorageKey,
      String(usuarioEncontrado.id),
    );
    return true;
  }

  function seleccionarAtleta(id: number) {
    const primeraRutina = rutinas.find((item) => item.atletaId === id);
    setAtletaSeleccionadoId(id);
    window.localStorage.setItem(selectedAthleteStorageKey, String(id));
    if (primeraRutina) setRutinaId(primeraRutina.id);
    setRegistros({});
  }

  function crearRutina(rutinaNueva: Rutina) {
    setRutinas((actuales) => [...actuales, rutinaNueva]);
    setRutinaId(rutinaNueva.id);
  }

  function crearEntrenamiento(
    item: NuevoEntrenamientoProgramado,
  ): EntrenamientoProgramado {
    const ahora = new Date().toISOString();
    const creado: EntrenamientoProgramado = {
      ...item,
      id: crearIdEntrenamiento(),
      creadoEn: ahora,
      actualizadoEn: ahora,
    };
    setEntrenamientos((actuales) => [...actuales, creado]);
    return creado;
  }

  function actualizarEntrenamiento(item: EntrenamientoProgramado) {
    setEntrenamientos((actuales) =>
      actuales.map((actual) =>
        actual.id === item.id
          ? { ...item, actualizadoEn: new Date().toISOString() }
          : actual,
      ),
    );
  }

  function eliminarEntrenamiento(id: string) {
    setEntrenamientos((actuales) =>
      actuales.filter((item) => item.id !== id),
    );
    setRegistros((actuales) =>
      Object.fromEntries(
        Object.entries(actuales).filter(
          ([key]) => !key.startsWith(`${id}-`),
        ),
      ),
    );
    if (entrenamientoActivoId === id) setEntrenamientoActivoId(null);
  }

  function comenzarEntrenamiento(item: EntrenamientoProgramado) {
    if (item.origen !== "rutina") return;
    setRutinaId(item.rutinaId);
    actualizarEntrenamiento({ ...item, estado: "en-curso" });
    setEntrenamientoActivoId(item.id);
  }

  function guardarComoPlantilla(rutina: Rutina) {
    if (!usuario || usuario.rol !== "entrenador") return;
    const id = idPlantilla(usuario.id);
    setPlantillas((actuales) => [
      ...actuales,
      {
        ...rutina,
        id,
        entrenadorId: usuario.id,
      },
    ]);
  }

  function asignarPlantilla(plantillaId: string, atletaId: number) {
    const plantilla = plantillas.find(
      (item) => item.id === plantillaId && item.entrenadorId === usuario?.id,
    );
    if (!plantilla) return;
    const rutinaNueva = rutinaDesdePlantilla(plantilla, atletaId);
    setRutinas((actuales) => [...actuales, rutinaNueva]);
    seleccionarAtleta(atletaId);
    setRutinaId(rutinaNueva.id);
    setRegistros({});
  }

  function eliminarPlantilla(plantillaId: string) {
    setPlantillas((actuales) =>
      actuales.filter(
        (plantilla) =>
          plantilla.id !== plantillaId || plantilla.entrenadorId !== usuario?.id,
      ),
    );
  }

  function crearAtleta(nombre: string, email: string) {
    if (!usuario || usuario.rol !== "entrenador") return;
    const id = Math.max(0, ...usuarios.map((item) => item.id)) + 1;
    const timestamp = Date.now();
    const nuevoAtleta: Usuario = {
      id,
      nombre,
      email,
      rol: "atleta",
    };
    const rutinaInicial: Rutina = {
      id: `rutina-${id}-${timestamp}`,
      atletaId: id,
      titulo: "Nueva rutina",
      objetivo: "Entrenamiento personalizado",
      duracion: 60,
      bloques: [
        {
          id: `bloque-${timestamp}`,
          nombre: "Bloque 1",
          tipo: "Personalizado",
          ejercicios: [],
        },
      ],
    };

    setUsuarios((actuales) => [
      ...actuales.map((item) =>
        item.id === usuario.id
          ? {
              ...item,
              atletaIds: [...(item.atletaIds ?? []), nuevoAtleta.id],
            }
          : item,
      ),
      nuevoAtleta,
    ]);
    setRutinas((actuales) => [...actuales, rutinaInicial]);
    setAtletaSeleccionadoId(id);
    setRutinaId(rutinaInicial.id);
    setRegistros({});
  }

  function eliminarRutina(id: string) {
    const restantes = rutinasDelAtleta.filter((item) => item.id !== id);
    if (restantes.length === 0) return;
    const idsDeEntrenamientos = entrenamientos
      .filter((item) => item.origen === "rutina" && item.rutinaId === id)
      .map((item) => item.id);
    setRutinas((actuales) => actuales.filter((item) => item.id !== id));
    setEntrenamientos((actuales) =>
      actuales.filter(
        (item) => item.origen !== "rutina" || item.rutinaId !== id,
      ),
    );
    setRutinaId(restantes[0].id);
    setRegistros((actuales) =>
      Object.fromEntries(
        Object.entries(actuales).filter(
          ([key]) =>
            !idsDeEntrenamientos.some((entrenamientoId) =>
              key.startsWith(`${entrenamientoId}-`),
            ),
        ),
      ),
    );
  }

  function salir() {
    window.localStorage.removeItem(sessionStorageKey);
    setUsuarioId(null);
    setVistaPrevia(false);
    setRegistros({});
    setEntrenamientoActivoId(null);
  }

  function intentarSalir() {
    if (
      editorDirty &&
      !window.confirm(
        "Tenés cambios sin guardar. ¿Querés descartarlos y cerrar sesión?",
      )
    ) {
      return;
    }
    salir();
  }

  if (!hidratado) {
    return <div className="min-h-screen bg-[#07080b]" />;
  }

  if (!usuario) {
    return <LandingAcceso onAccess={acceder} />;
  }

  if (!atleta || !rutina) {
    return <LandingAcceso onAccess={acceder} />;
  }

  const mostrandoAtleta = usuario.rol === "atleta" || vistaPrevia;

  return (
    <AppShell
      usuario={usuario}
      vistaPrevia={vistaPrevia}
      vistaEntrenador={vistaEntrenador}
      vistaAtleta={vistaAtleta}
      onClosePreview={() => setVistaPrevia(false)}
      onLogout={intentarSalir}
    >
      {!mostrandoAtleta ? (
        <HomeEntrenador
          key={`${atleta.id}-${rutina.id}`}
          entrenador={usuario}
          usuarios={usuarios}
          atletas={atletasDelCoach}
          atleta={atleta}
          rutinas={rutinasDelAtleta}
          rutinasPorAtleta={rutinas.filter((item) =>
            atletasDelCoach.some((atletaActual) => atletaActual.id === item.atletaId),
          )}
          entrenamientos={entrenamientos.filter(
            (item) => item.atletaId === atleta.id,
          )}
          plantillas={plantillas.filter(
            (plantilla) => plantilla.entrenadorId === usuario.id,
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
          onCreateEntrenamiento={crearEntrenamiento}
          onUpdateEntrenamiento={actualizarEntrenamiento}
          onDeleteEntrenamiento={eliminarEntrenamiento}
          onDirtyChange={setEditorDirty}
          verComoAtleta={() => setVistaPrevia(true)}
        />
      ) : vistaAtleta === "agenda" && !entrenamientoActivo ? (
        <AgendaDeportiva
          atleta={atleta}
          usuarioActual={usuario}
          rutinas={rutinasDelAtleta}
          entrenamientos={entrenamientos.filter(
            (item) => item.atletaId === atleta.id,
          )}
          modoCoach={usuario.rol === "entrenador"}
          onCreate={crearEntrenamiento}
          onUpdate={actualizarEntrenamiento}
          onDelete={eliminarEntrenamiento}
          onStart={comenzarEntrenamiento}
        />
      ) : vistaAtleta === "inicio" && !entrenamientoActivo ? (
        <HomeHoy
          atleta={atleta}
          rutinas={rutinasDelAtleta}
          entrenamientos={entrenamientos.filter(
            (item) => item.atletaId === atleta.id,
          )}
          onStart={comenzarEntrenamiento}
        />
      ) : (
        <ExperienciaAtleta
          key={`${rutinaDeEntrenamiento.id}-${entrenamientoActivo?.id ?? "rutinas"}`}
          atleta={atleta}
          rutinas={rutinasDelAtleta}
          rutina={rutinaDeEntrenamiento}
          entrenamientoInicial={entrenamientoActivo}
          onSelect={setRutinaId}
          onCreateEntrenamiento={crearEntrenamiento}
          onUpdateEntrenamiento={actualizarEntrenamiento}
          onCloseScheduled={() => setEntrenamientoActivoId(null)}
          registros={registros}
          setRegistros={setRegistros}
        />
      )}
    </AppShell>
  );
}
