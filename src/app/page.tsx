"use client";

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
  Dumbbell,
  Flame,
  GripVertical,
  LayoutGrid,
  Link2,
  ListChecks,
  Minus,
  MoveHorizontal,
  Plus,
  RotateCcw,
  Route,
  SkipForward,
  TimerReset,
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

type Rol = "entrenador" | "atleta";

type Ejercicio = {
  id: string;
  nombre: string;
  aclaraciones: string;
  series: number;
  repeticiones: number;
  peso: number;
  descanso: number;
};

type Bloque = {
  id: string;
  nombre: string;
  tipo: string;
  ejercicios: Ejercicio[];
};

type Rutina = {
  id: string;
  dia: string;
  titulo: string;
  objetivo: string;
  duracion: number;
  bloques: Bloque[];
};

type RegistroSerie = {
  peso: number;
  repeticiones: number;
  completada: boolean;
  omitida: boolean;
};

const ejercicio = (
  id: string,
  nombre: string,
  series: number,
  repeticiones: string,
  peso: string,
  aclaracionManual = "",
  descanso = 60,
): Ejercicio => {
  let nombreLimpio = nombre;
  const aclaraciones = new Set<string>();
  const calificadores: Array<[RegExp, string]> = [
    [/\s+con disco/gi, "Con disco"],
    [/\s+con tope/gi, "Con tope"],
    [/\s+a 1 pierna/gi, "A una pierna"],
    [/\s+a una pierna/gi, "A una pierna"],
    [/\s+a 2 piernas/gi, "A dos piernas"],
    [/\s+a dos piernas/gi, "A dos piernas"],
    [/\s+con cajón/gi, "Con cajón"],
  ];

  calificadores.forEach(([patron, aclaracion]) => {
    if (patron.test(nombreLimpio)) {
      aclaraciones.add(aclaracion);
      nombreLimpio = nombreLimpio.replace(patron, "");
    }
  });

  if (/segundos/i.test(repeticiones)) aclaraciones.add("Segundos");
  if (/min/i.test(repeticiones)) aclaraciones.add("Minutos");
  if (/c\/l/i.test(repeticiones)) aclaraciones.add("Cada lado");

  const pesoNumerico = Number.parseFloat(peso.replace(",", "."));
  if (!Number.isFinite(pesoNumerico)) aclaraciones.add(peso);
  if (aclaracionManual) aclaraciones.add(aclaracionManual);

  return {
    id,
    nombre: nombreLimpio.trim(),
    aclaraciones: [...aclaraciones].filter(Boolean).join(" · "),
    series,
    repeticiones: Number.parseInt(repeticiones, 10) || 0,
    peso: Number.isFinite(pesoNumerico) ? pesoNumerico : 0,
    descanso,
  };
};

const rutinasIniciales: Rutina[] = [
  {
    id: "dia-1",
    dia: "Día 1",
    titulo: "Fuerza de tren inferior",
    objetivo: "Glúteos, cuádriceps e isquiotibiales",
    duracion: 65,
    bloques: [
      {
        id: "d1-entrada",
        nombre: "Entrada en calor",
        tipo: "Preparación",
        ejercicios: [
          ejercicio("d1-bici", "Bici", 1, "10 min", "Sin peso"),
          ejercicio(
            "d1-plancha",
            "Plancha baja, lateral y lateral",
            1,
            "20 segundos",
            "Con disco",
          ),
          ejercicio(
            "d1-puente",
            "Puente de glúteo isométrico",
            1,
            "30",
            "20 kilos",
          ),
          ejercicio(
            "d1-banda",
            "Caminata lateral con banda",
            1,
            "4 C/L",
            "Con banda",
          ),
        ],
      },
      {
        id: "d1-activacion",
        nombre: "Activación",
        tipo: "Preparación específica",
        ejercicios: [
          ejercicio(
            "d1-polea",
            "Polea para cuádriceps e isquios",
            3,
            "10",
            "Combinado",
          ),
        ],
      },
      {
        id: "d1-bloque-1",
        nombre: "Bloque 1",
        tipo: "Alternado",
        ejercicios: [
          ejercicio("d1-hip", "Hip thrust", 3, "10", "Con barra"),
          ejercicio(
            "d1-estocadas",
            "Estocadas con disco",
            3,
            "10",
            "Con disco",
          ),
        ],
      },
      {
        id: "d1-bloque-2",
        nombre: "Bloque 2",
        tipo: "Alternado",
        ejercicios: [
          ejercicio("d1-prensa", "Prensa a 2 piernas", 3, "10", "A elección"),
          ejercicio(
            "d1-sillon",
            "Sillón de cuádriceps a 1 pierna",
            3,
            "10",
            "A elección",
          ),
        ],
      },
      {
        id: "d1-bloque-3",
        nombre: "Bloque 3",
        tipo: "Alternado",
        ejercicios: [
          ejercicio(
            "d1-sentadilla",
            "Sentadilla 3 tiempos",
            3,
            "20 segundos",
            "20 kilos",
          ),
          ejercicio(
            "d1-gluteos-polea",
            "Glúteos en polea",
            3,
            "10",
            "40",
          ),
        ],
      },
      {
        id: "d1-final",
        nombre: "Finalizador",
        tipo: "Cierre",
        ejercicios: [
          ejercicio(
            "d1-caminata-isquios",
            "Caminata de isquiotibiales y sóleos de búlgara",
            3,
            "8",
            "Sin peso",
          ),
        ],
      },
    ],
  },
  {
    id: "dia-2",
    dia: "Día 2",
    titulo: "Fuerza unilateral",
    objetivo: "Control, estabilidad y fuerza de piernas",
    duracion: 68,
    bloques: [
      {
        id: "d2-entrada",
        nombre: "Entrada en calor",
        tipo: "Preparación",
        ejercicios: [
          ejercicio("d2-bici", "Bici", 1, "10 min", "Sin peso"),
          ejercicio(
            "d2-abdominales",
            "Abdominales bicicleta",
            3,
            "50",
            "Sin peso",
          ),
          ejercicio(
            "d2-isometrica",
            "Sentadilla isométrica",
            3,
            "30",
            "20 kilos",
          ),
          ejercicio(
            "d2-granjero",
            "Caminata de granjero",
            3,
            "4 C/L",
            "Ir aumentando el peso",
            "Atento a la técnica de caminata",
          ),
        ],
      },
      {
        id: "d2-activacion",
        nombre: "Activación",
        tipo: "Preparación específica",
        ejercicios: [
          ejercicio(
            "d2-polea",
            "Polea para cuádriceps e isquios",
            3,
            "10",
            "Combinado",
          ),
        ],
      },
      {
        id: "d2-bloque-1",
        nombre: "Bloque 1",
        tipo: "Alternado",
        ejercicios: [
          ejercicio(
            "d2-sentadilla-tope",
            "Sentadillas con tope",
            3,
            "10",
            "Barra",
          ),
          ejercicio(
            "d2-gemelos",
            "Gemelos a 1 pierna",
            3,
            "10",
            "Barra",
          ),
        ],
      },
      {
        id: "d2-bloque-2",
        nombre: "Bloque 2",
        tipo: "Alternado",
        ejercicios: [
          ejercicio(
            "d2-prensa",
            "Prensa a 1 pierna",
            3,
            "10",
            "15 kilos",
          ),
          ejercicio(
            "d2-gluteo-cajon",
            "Glúteos a una pierna con cajón",
            3,
            "10",
            "10 kilos",
          ),
        ],
      },
      {
        id: "d2-bloque-3",
        nombre: "Bloque 3",
        tipo: "Alternado",
        ejercicios: [
          ejercicio(
            "d2-bulgaras",
            "Sentadillas búlgaras",
            3,
            "10",
            "Disco",
          ),
          ejercicio(
            "d2-sillon",
            "Sillón de cuádriceps a 2 piernas",
            3,
            "10",
            "A elección",
          ),
        ],
      },
      {
        id: "d2-final",
        nombre: "Finalizador",
        tipo: "Cierre",
        ejercicios: [
          ejercicio(
            "d2-curl",
            "Curl nórdico invertido + glúteo medio",
            3,
            "10",
            "Sin disco",
          ),
        ],
      },
    ],
  },
];

const storageKey = "rttp-rutinas-v3";

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

function cantidadEjercicios(rutina: Rutina) {
  return rutina.bloques.reduce(
    (total, bloque) => total + bloque.ejercicios.length,
    0,
  );
}

function rondasDelBloque(bloque: Bloque) {
  return Math.max(0, ...bloque.ejercicios.map((item) => item.series));
}

function pasosDeRutina(rutina: Rutina) {
  return rutina.bloques.flatMap((bloque, bloqueIndex) => {
    const rondas = rondasDelBloque(bloque);

    return Array.from({ length: rondas }, (_, rondaIndex) =>
      bloque.ejercicios
        .filter((item) => item.series > rondaIndex)
        .map((item, posicion) => ({
          ...item,
          pasoId: `${rutina.id}-${item.id}-${rondaIndex}`,
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

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-full border border-violet-200/15 bg-indigo-300/10 shadow-[inset_0_1px_0_rgba(255,255,255,.1)]">
        <div className="size-3.5 rounded-full border-[3px] border-cyan-300 border-r-violet-400" />
      </div>
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

function SelectorRol({
  rol,
  onChange,
}: {
  rol: Rol;
  onChange: (rol: Rol) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-black/55 p-1">
      {(["entrenador", "atleta"] as Rol[]).map((item) => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={cn(
            "rounded-full px-3 py-2 text-[11px] font-medium capitalize transition-all sm:px-4",
            rol === item
              ? "bg-indigo-50 text-indigo-950 shadow-lg"
              : "text-indigo-100/45 hover:text-white",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function AppShell({
  rol,
  onRolChange,
  children,
}: {
  rol: Rol;
  onRolChange: (rol: Rol) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#07080b] text-white selection:bg-cyan-300 selection:text-black">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_-10%,rgba(34,211,238,.14),transparent_32%),radial-gradient(circle_at_10%_70%,rgba(124,58,237,.15),transparent_35%)]" />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-white/[0.07] bg-[#0a0b0f]/92 px-5 py-7 backdrop-blur-xl lg:flex">
        <Logo />
        <nav className="mt-12 space-y-2">
          {[
            [LayoutGrid, "Inicio"],
            [ListChecks, "Rutinas"],
            [Users, "Atletas"],
          ].map(([Icon, label], index) => {
            const NavIcon = Icon as typeof LayoutGrid;
            return (
              <button
                key={label as string}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-colors",
                  index === 1
                    ? "bg-indigo-300/10 text-white"
                    : "text-indigo-100/35 hover:bg-indigo-300/[0.07] hover:text-white/75",
                )}
              >
                <NavIcon className="size-4" />
                {label as string}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-2xl border border-indigo-200/[0.08] bg-indigo-300/[0.06] p-3">
          <Avatar className="size-8 border border-violet-200/15">
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-[10px] text-white">
              SP
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xs">Sofía P.</div>
            <div className="text-[9px] text-indigo-100/35">Entrenador</div>
          </div>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-18 items-center justify-between border-b border-white/[0.07] bg-[#07080b]/88 px-4 backdrop-blur-xl lg:left-56 lg:px-8">
        <Logo />
        <SelectorRol rol={rol} onChange={onRolChange} />
      </header>

      <main className="relative min-h-screen pt-18 lg:pl-56">{children}</main>
    </div>
  );
}

function SelectorRutina({
  rutinas,
  rutinaActiva,
  onSelect,
}: {
  rutinas: Rutina[];
  rutinaActiva: Rutina;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {rutinas.map((rutina, index) => (
        <button
          key={rutina.id}
          onClick={() => onSelect(rutina.id)}
          className={cn(
            "rounded-2xl border p-3 text-left transition-all",
            rutina.id === rutinaActiva.id
              ? index % 2 === 0
                ? "border-blue-300/35 bg-blue-400/[0.10]"
                : "border-violet-300/35 bg-violet-400/[0.10]"
              : "border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.06]",
          )}
        >
          <div className="text-[10px] uppercase tracking-wider text-cyan-200/65">
            {rutina.dia}
          </div>
          <div className="mt-1 truncate text-sm font-medium">{rutina.titulo}</div>
          <div className="mt-1 text-[10px] text-indigo-100/35">
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
        "mx-3 my-2 grid gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-3 py-3 shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center",
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
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-violet-300/10 text-[10px] font-medium text-violet-100/60">
          {item.nombre
            .split(" ")
            .map((palabra) => palabra[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm">{item.nombre}</div>
          <Input
            value={item.aclaraciones}
            onChange={(event) =>
              onUpdate({ ...item, aclaraciones: event.target.value })
            }
            aria-label={`Aclaraciones de ${item.nombre}`}
            placeholder="Agregar aclaraciones"
            className="mt-1 h-6 border-0 bg-transparent p-0 text-[10px] text-violet-100/55 shadow-none placeholder:text-white/20 focus-visible:ring-0"
          />
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 md:justify-start">
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
        <label className="w-20">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={item.repeticiones}
            onChange={(event) =>
              onUpdate({
                ...item,
                repeticiones: Math.max(0, Number(event.target.value)),
              })
            }
            aria-label={`Repeticiones de ${item.nombre}`}
            className="h-8 border-white/10 bg-black/25 text-xs"
          />
          <div className="mt-1 text-[8px] uppercase text-indigo-100/25">
            repeticiones
          </div>
        </label>
        <label className="w-20">
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
            className="h-8 border-white/10 bg-black/25 text-xs"
          />
          <div className="mt-1 text-[8px] uppercase text-indigo-100/25">
            peso (kg)
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
          "flex w-full items-center justify-between px-4 py-3 text-left transition-colors",
          index % 2 === 0
            ? "bg-blue-400/[0.045] hover:bg-blue-400/[0.09]"
            : "bg-violet-400/[0.045] hover:bg-violet-400/[0.09]",
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full text-[9px] font-semibold text-indigo-950",
              index % 3 === 0
                ? "bg-cyan-300"
                : index % 3 === 1
                  ? "bg-violet-300"
                  : "bg-blue-300",
            )}
          >
            {index + 1}
          </span>
          <span className="text-xs font-medium">{bloque.nombre}</span>
          <span className="hidden text-[9px] text-white/30 sm:inline">
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
              <div className="m-3 rounded-2xl border border-dashed border-white/10 p-5 text-center text-[10px] text-white/30">
                Arrastrá un ejercicio hasta acá
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
  const [repeticiones, setRepeticiones] = useState("10");
  const [peso, setPeso] = useState("0");
  const [aclaraciones, setAclaraciones] = useState("");
  const [bloqueId, setBloqueId] = useState(bloques?.[0]?.id ?? "nuevo");
  const [nuevoBloque, setNuevoBloque] = useState("");

  function agregar() {
    if (!nombre.trim() || (bloqueId === "nuevo" && !nuevoBloque.trim())) return;
    onAdd(
      ejercicio(
        `${nombre.toLowerCase().replace(/\W+/g, "-")}-${Date.now()}`,
        nombre.trim(),
        Math.max(1, Number(series) || 1),
        repeticiones.trim() || "10",
        peso.trim() || "0",
        aclaraciones.trim(),
      ),
      bloqueId,
      nuevoBloque.trim(),
    );
    setNombre("");
    setAclaraciones("");
    setNuevoBloque("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Series", series, setSeries],
              ["Repeticiones", repeticiones, setRepeticiones],
              ["Peso", peso, setPeso],
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
          <Button
            onClick={agregar}
            disabled={
              !nombre.trim() ||
              (bloqueId === "nuevo" && !nuevoBloque.trim())
            }
            className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
          >
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HomeEntrenador({
  rutinas,
  rutina,
  onSelect,
  setRutina,
  verComoAtleta,
}: {
  rutinas: Rutina[];
  rutina: Rutina;
  onSelect: (id: string) => void;
  setRutina: React.Dispatch<React.SetStateAction<Rutina>>;
  verComoAtleta: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const [bloqueAbierto, setBloqueAbierto] = useState<string | null>(null);
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

  function copiar() {
    void navigator.clipboard?.writeText(window.location.href);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 md:px-8 md:py-9">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200/60">
            Rutinas de Kevin
          </div>
          <h1 className="text-3xl font-light tracking-tight">
            Plan de entrenamiento
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={copiar}
            className="rounded-full border-indigo-200/10 bg-indigo-300/[0.05] text-white hover:bg-indigo-300/10 hover:text-white"
          >
            {copiado ? <Check /> : <Link2 />}
            {copiado ? "Copiado" : "Compartir"}
          </Button>
          <Button
            onClick={verComoAtleta}
            className="rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
          >
            Vista atleta
            <ArrowRight />
          </Button>
        </div>
      </div>

      <SelectorRutina
        rutinas={rutinas}
        rutinaActiva={rutina}
        onSelect={onSelect}
      />

      <Card className="mt-4 overflow-hidden border-white/[0.08] bg-[#0f1015] text-white shadow-[0_24px_70px_rgba(37,28,100,.18)]">
        <CardHeader className="border-b border-indigo-200/[0.07] p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Input
                value={rutina.titulo}
                onChange={(event) =>
                  setRutina((actual) => ({
                    ...actual,
                    titulo: event.target.value,
                  }))
                }
                aria-label="Nombre de la rutina"
                className="h-auto border-0 bg-transparent p-0 text-lg font-medium shadow-none focus-visible:ring-0"
              />
              <p className="mt-1 text-[11px] text-indigo-100/35">
                {rutina.objetivo} · {rutina.duracion} min ·{" "}
                {totalSeries(rutina)} series
              </p>
            </div>
            <DialogoEjercicio
              bloques={rutina.bloques}
              onAdd={agregarEjercicio}
            />
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
              {rutina.dia.toUpperCase()}
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
                              {item.series}×{item.repeticiones} · {item.peso} kg
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
  rutinas,
  rutina,
  onSelect,
  onStart,
  progreso,
  onReset,
}: {
  rutinas: Rutina[];
  rutina: Rutina;
  onSelect: (id: string) => void;
  onStart: () => void;
  progreso: number;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-7 md:px-8 md:py-9">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs text-white/40">Hola, Kevin</div>
          <h1 className="mt-0.5 text-2xl font-light">¿Entrenamos?</h1>
        </div>
        <Avatar className="size-10 border border-violet-200/15">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-xs text-white">
            K
          </AvatarFallback>
        </Avatar>
      </div>

      <SelectorRutina
        rutinas={rutinas}
        rutinaActiva={rutina}
        onSelect={onSelect}
      />

      <Card className="relative mt-4 overflow-hidden border-white/[0.09] bg-[#101116] text-white shadow-[0_30px_80px_rgba(0,0,0,.45)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(34,211,238,.18),transparent_35%),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.18),transparent_42%)]" />
        <CardContent className="relative p-5 md:p-7">
          <div className="flex items-center justify-between">
            <Badge className="border-cyan-200/15 bg-cyan-300/10 text-[9px] text-cyan-100">
              {rutina.dia.toUpperCase()}
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
  );
}

function CampoPrescripcion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-2xl border border-white/[0.09] bg-black/30 p-4">
      <span className="text-[9px] uppercase tracking-[0.16em] text-indigo-100/30">
        {label}
      </span>
      <Input
        type="number"
        inputMode={label.startsWith("Peso") ? "decimal" : "numeric"}
        min={0}
        step={label.startsWith("Peso") ? "0.5" : "1"}
        value={value}
        onChange={(event) =>
          onChange(Math.max(0, Number(event.target.value)))
        }
        onPointerDown={(event) => event.stopPropagation()}
        className="mt-2 h-auto border-0 bg-transparent p-0 text-xl font-light text-white shadow-none focus-visible:ring-0 sm:text-2xl"
      />
    </label>
  );
}

function WorkoutMode({
  rutina,
  registros,
  setRegistros,
  indiceActivo,
  setIndiceActivo,
  onExit,
  onFinish,
}: {
  rutina: Rutina;
  registros: Record<string, RegistroSerie>;
  setRegistros: React.Dispatch<
    React.SetStateAction<Record<string, RegistroSerie>>
  >;
  indiceActivo: number;
  setIndiceActivo: React.Dispatch<React.SetStateAction<number>>;
  onExit: () => void;
  onFinish: () => void;
}) {
  const pasos = pasosDeRutina(rutina);
  const paso = pasos[indiceActivo];
  const bloque = rutina.bloques[paso.bloqueIndex];
  const proximo = pasos[indiceActivo + 1];
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const inicioPointer = useRef<number | null>(null);
  const distanciaPointer = useRef(0);

  const valorInicial: RegistroSerie = {
    peso: paso.peso,
    repeticiones: paso.repeticiones,
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
              repeticiones: item.repeticiones,
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
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-5xl flex-col overflow-hidden px-4 py-5 md:px-8 md:py-7">
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

      <div className="mx-auto mt-5 w-full max-w-lg">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <Badge className="border-violet-200/15 bg-violet-300/10 text-[9px] text-violet-100">
              {paso.bloqueNombre}
            </Badge>
            <span className="ml-2 text-[9px] text-indigo-100/30">
              Ronda {paso.ronda}/{paso.rondas}
            </span>
          </div>
          <div className="flex gap-1.5">
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

        <div className="relative min-h-[515px]">
          {pasos[indiceActivo + 2] && (
            <div className="absolute inset-x-8 top-6 h-[475px] rounded-[2rem] border border-blue-200/[0.06] bg-blue-300/[0.025]" />
          )}
          {proximo && (
            <div className="absolute inset-x-4 top-3 h-[475px] rounded-[2rem] border border-violet-200/[0.09] bg-violet-300/[0.045]" />
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
              "relative z-10 min-h-[475px] select-none overflow-hidden rounded-[2rem] border bg-[#101116] p-5 shadow-[0_30px_80px_rgba(0,0,0,.5)] md:p-6",
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
            <div className="relative flex min-h-[425px] flex-col">
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
                <div className="mt-5 flex w-full flex-col rounded-xl border border-violet-300/15 bg-violet-300/[0.07] px-3 py-2.5">
                  <span className="text-[8px] uppercase tracking-[0.14em] text-violet-200/45">
                    Aclaraciones
                  </span>
                  <span className="mt-1 text-[11px] leading-relaxed text-violet-100/70">
                    {paso.aclaraciones}
                  </span>
                </div>
              )}

              <Separator className="my-5 bg-indigo-200/[0.08]" />

              <div className="grid grid-cols-2 gap-3">
                <CampoPrescripcion
                  label="Repeticiones"
                  value={registro.repeticiones}
                  onChange={(repeticiones) => actualizar({ repeticiones })}
                />
                <CampoPrescripcion
                  label="Peso (kg)"
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

        <div className="text-center">
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

        <div className="mt-4 flex gap-2">
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

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-indigo-200/[0.08] bg-indigo-300/[0.04] p-3">
          <div className="flex items-center gap-2 text-[10px] text-indigo-100/35">
            <TimerReset className="size-3.5 text-violet-200" />
            Descanso sugerido: {paso.descanso} s
          </div>
          <div className="max-w-40 truncate text-[10px] text-indigo-100/35">
            Próximo: {proximo?.nombre ?? "Fin"}
          </div>
        </div>
      </div>
    </div>
  );
}

function RutinaCompletada({
  feedback,
  setFeedback,
  onDone,
}: {
  feedback: string;
  setFeedback: (value: string) => void;
  onDone: () => void;
}) {
  const [esfuerzo, setEsfuerzo] = useState(4);
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-xl place-items-center px-4 py-8">
      <Card className="w-full border-violet-200/[0.12] bg-[#101116] text-center text-white shadow-[0_30px_90px_rgba(0,0,0,.5)]">
        <CardContent className="p-6 md:p-9">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-400 text-indigo-950">
            <Trophy className="size-6" />
          </div>
          <h1 className="mt-5 text-3xl font-light">Rutina completada</h1>
          <p className="mt-2 text-xs text-indigo-100/40">
            Excelente trabajo, Kevin.
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
        </CardContent>
      </Card>
    </div>
  );
}

function ExperienciaAtleta({
  rutinas,
  rutina,
  onSelect,
  registros,
  setRegistros,
}: {
  rutinas: Rutina[];
  rutina: Rutina;
  onSelect: (id: string) => void;
  registros: Record<string, RegistroSerie>;
  setRegistros: React.Dispatch<
    React.SetStateAction<Record<string, RegistroSerie>>
  >;
}) {
  const [pantalla, setPantalla] = useState<"home" | "workout" | "final">("home");
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [feedback, setFeedback] = useState("");
  const progreso = Object.entries(registros).filter(
    ([key, value]) => key.startsWith(`${rutina.id}-`) && value.completada,
  ).length;

  function reset() {
    setRegistros((actuales) =>
      Object.fromEntries(
        Object.entries(actuales).filter(
          ([key]) => !key.startsWith(`${rutina.id}-`),
        ),
      ),
    );
    setIndiceActivo(0);
  }

  if (pantalla === "workout") {
    return (
      <WorkoutMode
        rutina={rutina}
        registros={registros}
        setRegistros={setRegistros}
        indiceActivo={indiceActivo}
        setIndiceActivo={setIndiceActivo}
        onExit={() => setPantalla("home")}
        onFinish={() => setPantalla("final")}
      />
    );
  }

  if (pantalla === "final") {
    return (
      <RutinaCompletada
        feedback={feedback}
        setFeedback={setFeedback}
        onDone={() => setPantalla("home")}
      />
    );
  }

  return (
    <HomeAtleta
      rutinas={rutinas}
      rutina={rutina}
      onSelect={(id) => {
        onSelect(id);
        setIndiceActivo(0);
      }}
      onStart={() => setPantalla("workout")}
      progreso={progreso}
      onReset={reset}
    />
  );
}

export default function Home() {
  const [rol, setRol] = useState<Rol>("entrenador");
  const [rutinas, setRutinas] = useState<Rutina[]>(rutinasIniciales);
  const [rutinaId, setRutinaId] = useState(rutinasIniciales[0].id);
  const [registros, setRegistros] = useState<
    Record<string, RegistroSerie>
  >({});
  const [hidratado, setHidratado] = useState(false);
  const rutina =
    rutinas.find((item) => item.id === rutinaId) ?? rutinasIniciales[0];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const guardadas = window.localStorage.getItem(storageKey);
      if (guardadas) {
        try {
          setRutinas(JSON.parse(guardadas) as Rutina[]);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      setHidratado(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hidratado) {
      window.localStorage.setItem(storageKey, JSON.stringify(rutinas));
    }
  }, [rutinas, hidratado]);

  const setRutina: React.Dispatch<React.SetStateAction<Rutina>> = (action) => {
    setRutinas((actuales) =>
      actuales.map((item) => {
        if (item.id !== rutinaId) return item;
        return typeof action === "function" ? action(item) : action;
      }),
    );
  };

  return (
    <AppShell rol={rol} onRolChange={setRol}>
      {rol === "entrenador" ? (
        <HomeEntrenador
          rutinas={rutinas}
          rutina={rutina}
          onSelect={setRutinaId}
          setRutina={setRutina}
          verComoAtleta={() => setRol("atleta")}
        />
      ) : (
        <ExperienciaAtleta
          key={rutina.id}
          rutinas={rutinas}
          rutina={rutina}
          onSelect={setRutinaId}
          registros={registros}
          setRegistros={setRegistros}
        />
      )}
    </AppShell>
  );
}
