"use client";

import Image from "next/image";
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
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
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
} from "lucide-react";

import { BlobatarAvatar } from "@/components/blobatar-avatar";
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
import { appVersion } from "@/lib/app-version";
import { ActivityHistory } from "@/components/activity-history";
import { SportsSchedule } from "@/components/sports-schedule";
import {
  CompletedActivity,
  activityId,
  ActivitySet,
} from "@/lib/rttp-activity";
import {
  activityCategories,
  createWorkoutId,
  ScheduledWorkout,
  localDate,
  NewScheduledWorkout,
} from "@/lib/rttp-agenda";
import {
  Block,
  Exercise,
  Routine,
  User,
  initialRoutines,
  initialUsers,
} from "@/lib/rttp-data";
import {
  loadSupabaseData,
  createAthleteWithRoutine,
  PersistedData,
  executeSupabaseMutation,
  UserIdMapping,
  migrateMissingData,
  SupabaseMutation,
  NewSupabaseMutation,
  remapSupabaseMutation,
} from "@/lib/rttp-supabase";
import { supabaseConfigured } from "@/lib/supabase";

type TrainingSetRecord = {
  weight: number;
  reps: number;
  completed: boolean;
  skipped: boolean;
};

const sessionStorageKey = "rttp-user-session-v2";
const selectedAthleteStorageKey = "rttp-selected-athlete-v2";
const sidebarPreferenceStorageKey = "rttp-sidebar-compact-v1";
const supabaseMigrationStorageKey = "rttp-supabase-migrated-v2";
const supabaseMigrationSourceStorageKey =
  "rttp-supabase-migration-source-v2";
const supabaseUserMappingStorageKey = "rttp-supabase-user-mapping-v2";
const supabaseOutboxStorageKey = "rttp-supabase-outbox-v2";
const supabaseMigrationLock = "rttp-supabase-migration";
const supabaseOutboxLock = "rttp-supabase-outbox";
const desktopPageShellClassName =
  "mx-auto max-w-[1760px] px-4 py-7 md:px-8 md:py-10 xl:px-10 xl:py-12";
const pageEyebrowClassName =
  "mb-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200/60";
const pageTitleClassName =
  "text-3xl font-light tracking-[-0.035em] md:text-4xl";
const pageDescriptionClassName =
  "mt-2 max-w-2xl text-xs leading-relaxed text-white/35 md:text-sm";

type RoutineTemplate = Omit<Routine, "athleteId"> & {
  coachId: number;
};

type MigrationSource = {
  persistedData: PersistedData;
  dataWithSeeds: PersistedData;
  useSeeds: boolean | null;
  mutations: SupabaseMutation[];
  userId: string | null;
  athleteId: string | null;
  remappingStarted: boolean;
};

type CoachView = "resumen" | "atletas" | "routines";
type AthleteView = "inicio" | "agenda" | "routines" | "activities";

function TextWithLinks({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const urlPattern = /\b(?:https?:\/\/|www\.)[^\s<]+/gi;
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of children.matchAll(urlPattern)) {
    const start = match.index;
    let url = match[0];
    let trailing = "";

    while (/[.,!?;:]$/.test(url)) {
      trailing = `${url.at(-1)}${trailing}`;
      url = url.slice(0, -1);
    }
    while (
      url.endsWith(")") &&
      (url.match(/\)/g)?.length ?? 0) > (url.match(/\(/g)?.length ?? 0)
    ) {
      trailing = `)${trailing}`;
      url = url.slice(0, -1);
    }

    parts.push(children.slice(cursor, start));
    const href = url.startsWith("www.") ? `https://${url}` : url;
    parts.push(
      <a
        key={`${start}-${url}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          event.stopPropagation();
          if (!window.confirm(`¿Querés abrir este enlace?\n\n${href}`)) {
            event.preventDefault();
          }
        }}
        className="font-medium text-cyan-200 underline decoration-cyan-200/35 underline-offset-2 transition-colors hover:text-cyan-100"
      >
        {url}
      </a>,
    );
    parts.push(trailing);
    cursor = start + match[0].length;
  }

  parts.push(children.slice(cursor));
  return <span className={className}>{parts}</span>;
}

function readSessionValue(key: string) {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key);
}

function writeSessionValue(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, value);
}

function removeSessionValue(key: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
}

function clearDeprecatedLocalStorage() {
  if (typeof window === "undefined") return;
  const keys = [
    "rttp-routines-v5",
    "rttp-routines-v4",
    "rttp-rutinas-v4",
    "rttp-templates-v2",
    "rttp-templates-v1",
    "rttp-plantillas-v1",
    "rttp-user-session-v2",
    "rttp-usuario-v1",
    "rttp-users-v2",
    "rttp-users-v1",
    "rttp-usuarios-v1",
    "rttp-selected-athlete-v2",
    "rttp-atleta-seleccionado-v1",
    "rttp-schedule-v2",
    "rttp-agenda-v1",
    "rttp-activities-v2",
    "rttp-activities-v1",
    "rttp-actividades-v1",
    "rttp-sidebar-compact-v1",
    "rttp-supabase-migrated-v2",
    "rttp-supabase-migrado-v1",
    "rttp-supabase-migration-source-v2",
    "rttp-supabase-origin-migracion-v1",
    "rttp-supabase-origen-migracion-v1",
    "rttp-supabase-user-mapping-v2",
    "rttp-supabase-mapeo-users-v1",
    "rttp-supabase-mapeo-usuarios-v1",
    "rttp-supabase-outbox-v2",
    "rttp-supabase-pendientes-v1",
  ] as const;
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

function blockTypeLabel(type: Block["type"]) {
  return {
    "consecutive-sets": "Series consecutivas",
    preparation: "Preparación",
    "specific-preparation": "Preparación específica",
    alternating: "Alternado",
    cooldown: "Cierre",
    "circuit-2-rounds": "Circuito · 2 vueltas",
    custom: "Personalizado",
  }[type];
}

function cantidadEjercicios({ blocks }: Pick<Routine, "blocks">) {
  return blocks.reduce(
    (total, bloque) => total + bloque.exercises.length,
    0,
  );
}

function rutinaTieneEjercicios(rutina: Pick<Routine, "blocks">) {
  return cantidadEjercicios(rutina) > 0;
}

function repeticionesObjetivo(item: Exercise) {
  return item.minReps === item.maxReps
    ? `${item.minReps}`
    : `${item.minReps}–${item.maxReps}`;
}

function rondasDelBloque(bloque: Block) {
  return Math.max(0, ...bloque.exercises.map((item) => item.sets));
}

function pasosDeRutina(rutina: Routine, sesionId = rutina.id) {
  return rutina.blocks.flatMap((bloque, bloqueIndex) => {
    const rondas = rondasDelBloque(bloque);

    return Array.from({ length: rondas }, (_, rondaIndex) =>
      bloque.exercises
        .filter((item) => item.sets > rondaIndex)
        .map((item, posicion) => ({
          ...item,
          stepId: `${sesionId}-${item.id}-${rondaIndex}`,
          blockId: bloque.id,
          bloqueIndex,
          blockName: bloque.name,
          round: rondaIndex + 1,
          rondas,
          posicion,
          ejerciciosEnRonda: bloque.exercises.filter(
            (ejercicioActual) => ejercicioActual.sets > rondaIndex,
          ).length,
        })),
    ).flat();
  });
}

function normalizeUser(user: User): User {
  if (
    user.id === 4 ||
    user.email === "testcoach@gmail.com" ||
    user.email === "coach@test.com"
  ) {
    return {
      ...user,
      email: "coach@test.com",
      role: "coach",
    };
  }

  if (
    user.id === 5 ||
    user.email === "testuser@gmail.com" ||
    user.email === "athlete@test.com"
  ) {
    return {
      ...user,
      email: "athlete@test.com",
      role: "athlete",
    };
  }

  return user;
}

function snapshotRoutine(rutina: Routine): Routine {
  return {
    ...rutina,
    blocks: rutina.blocks.map((bloque) => ({
      ...bloque,
      exercises: bloque.exercises.map((ejercicio) => ({ ...ejercicio })),
    })),
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado al sincronizar los datos.";
}

function readPendingMutations() {
  const guardadas = readSessionValue(supabaseOutboxStorageKey);
  if (!guardadas) return [];
  try {
    return JSON.parse(guardadas) as SupabaseMutation[];
  } catch {
    removeSessionValue(supabaseOutboxStorageKey);
    throw new Error(
      "La cola temporal de sincronización estaba dañada y debió reiniciarse.",
    );
  }
}

function savePendingMutations(mutations: SupabaseMutation[]) {
  if (mutations.length === 0) {
    removeSessionValue(supabaseOutboxStorageKey);
    return;
  }
  writeSessionValue(supabaseOutboxStorageKey, JSON.stringify(mutations));
}

function readMigrationSource() {
  const guardado = readSessionValue(supabaseMigrationSourceStorageKey);
  if (!guardado) return null;
  try {
    return JSON.parse(guardado) as MigrationSource;
  } catch {
    throw new Error(
      "El respaldo temporal para migrar a Supabase está dañado.",
    );
  }
}

function saveMigrationSource(origin: MigrationSource) {
  writeSessionValue(supabaseMigrationSourceStorageKey, JSON.stringify(origin));
}

function readUserMapping() {
  const guardado = readSessionValue(supabaseUserMappingStorageKey);
  if (!guardado) return {};
  try {
    return JSON.parse(guardado) as UserIdMapping;
  } catch {
    throw new Error("El mapeo temporal de perfiles está dañado.");
  }
}

async function enqueueMutation(
  mutation: SupabaseMutation,
  requiresRemapping: boolean,
) {
  await navigator.locks.request(supabaseMigrationLock, async () => {
    await navigator.locks.request(supabaseOutboxLock, () => {
      const finalMutation =
        requiresRemapping &&
        readSessionValue(supabaseMigrationStorageKey) === "true"
          ? remapSupabaseMutation(mutation, readUserMapping())
          : mutation;
      savePendingMutations([
        ...readPendingMutations(),
        finalMutation,
      ]);
    });
  });
}

async function executePendingMutations() {
  await navigator.locks.request(supabaseMigrationLock, async () => {
    await navigator.locks.request(supabaseOutboxLock, async () => {
      if (!supabaseConfigured) {
        throw new Error(
          "Supabase no está configurado. Los cambios solo vivirán mientras esta pestaña siga abierta.",
        );
      }
      if (readSessionValue(supabaseMigrationStorageKey) !== "true") {
        throw new Error(
          "La migración inicial está pendiente. Los cambios se sincronizarán al recuperar la conexión.",
        );
      }
      while (true) {
        const mutation = readPendingMutations()[0];
        if (!mutation) return;
        await executeSupabaseMutation(mutation);
        savePendingMutations(
          readPendingMutations().filter(
            (pending) => pending.id !== mutation.id,
          ),
        );
      }
    });
  });
}

function rutinaDesdePlantilla(
  plantilla: RoutineTemplate,
  athleteId: number,
): Routine {
  const idBase = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    ...plantilla,
    id: `rutina-${athleteId}-${idBase}`,
    athleteId,
    blocks: plantilla.blocks.map((bloque, bloqueIndex) => ({
      ...bloque,
      id: `bloque-${idBase}-${bloqueIndex}`,
      exercises: bloque.exercises.map((ejercicio, ejercicioIndex) => ({
        ...ejercicio,
        id: `ejercicio-${idBase}-${bloqueIndex}-${ejercicioIndex}`,
      })),
    })),
  };
}

function idPlantilla(coachId: number) {
  return `plantilla-${coachId}-${Date.now()}`;
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

function VersionLabel({ className }: { className?: string }) {
  return (
    <span
      aria-label={`Versión ${appVersion}`}
      className={cn(
        "text-[9px] font-medium tabular-nums tracking-[0.08em] text-white/25",
        className,
      )}
    >
      v{appVersion}
    </span>
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
      <VersionLabel className="absolute bottom-5 left-1/2 -translate-x-1/2" />
    </main>
  );
}

function AppShell({
  usuario,
  vistaPrevia,
  workoutImmersive,
  vistaEntrenador,
  vistaAtleta,
  syncError,
  onClosePreview,
  onLogout,
  navigate,
  children,
}: {
  usuario: User;
  vistaPrevia: boolean;
  workoutImmersive: boolean;
  vistaEntrenador: CoachView;
  vistaAtleta: AthleteView;
  syncError: string | null;
  onClosePreview: () => void;
  onLogout: () => void;
  navigate: (path: string) => void;
  children: React.ReactNode;
}) {
  const esEntrenador = usuario.role === "coach";
  const [sidebarCompact, setSidebarCompact] = useState(() => {
    if (typeof window === "undefined") return false;
    return readSessionValue(sidebarPreferenceStorageKey) === "true";
  });
  const encabezadoEntrenador =
    vistaEntrenador === "atletas"
      ? ["Atletas", "Perfiles y planificación individual"]
      : vistaEntrenador === "routines"
        ? ["Biblioteca de rutinas", "Plantillas reutilizables para tus atletas"]
        : ["Resumen", "Organización y seguimiento de planes"];
  const encabezado = esEntrenador
    ? encabezadoEntrenador
    : vistaAtleta === "agenda"
      ? ["Agenda deportiva", "Tu semana de entrenamiento"]
      : vistaAtleta === "activities"
        ? ["Actividades", "Tu historial deportivo"]
      : vistaAtleta === "routines"
        ? ["Rutinas", "Todos tus planes asignados"]
        : ["Inicio", "Tu entrenamiento de hoy"];
  const navegacionCoach = [
    {
      icon: LayoutGrid,
      label: "Resumen",
      description: "Vista general",
      href: "/coach",
      view: "resumen" as const,
    },
    {
      icon: Users,
      label: "Atletas",
      description: "Gestioná tus alumnos",
      href: "/coach/athletes",
      view: "atletas" as const,
    },
    {
      icon: ListChecks,
      label: "Rutinas",
      description: "Plantillas y planes",
      href: "/coach/routines",
      view: "routines" as const,
    },
  ];
  const navegacionAtleta = [
    {
      icon: House,
      label: "Inicio",
      description: "Tu entrenamiento de hoy",
      href: "/",
      view: "inicio" as const,
    },
    {
      icon: Dumbbell,
      label: "Rutinas",
      description: "Todos tus planes",
      href: "/routines",
      view: "routines" as const,
    },
    {
      icon: CalendarDays,
      label: "Agenda",
      description: "Organizá tu semana",
      href: "/schedule",
      view: "agenda" as const,
    },
    {
      icon: Activity,
      label: "Progreso",
      description: "Tu historial deportivo",
      href: "/activities",
      view: "activities" as const,
    },
  ];
  const navegacion = esEntrenador ? navegacionCoach : navegacionAtleta;

  useEffect(() => {
    writeSessionValue(sidebarPreferenceStorageKey, String(sidebarCompact));
  }, [sidebarCompact]);

  return (
    <div className="min-h-screen bg-[#07080b] text-white selection:bg-cyan-300 selection:text-black">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_-10%,rgba(34,211,238,.14),transparent_32%),radial-gradient(circle_at_10%_70%,rgba(124,58,237,.15),transparent_35%)]" />
      {!vistaPrevia && !workoutImmersive && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/[0.07] bg-[#0a0b0f]/92 py-7 backdrop-blur-xl lg:flex",
            sidebarCompact ? "w-24 px-3" : "w-64 px-5",
          )}
        >
          <div
            className={cn(
              "flex",
              sidebarCompact
                ? "items-center justify-center gap-2"
                : "items-start justify-between gap-3",
            )}
          >
            <div className={cn(sidebarCompact && "hidden")}>
              <Logo />
            </div>
            {sidebarCompact && (
              <Image
                src="/rttp-mark-v2.png"
                alt="RTTP"
                width={40}
                height={40}
                unoptimized
                className="size-10 object-contain drop-shadow-[0_0_12px_rgba(99,102,241,.18)]"
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={
                sidebarCompact ? "Expandir barra lateral" : "Compactar barra lateral"
              }
              title={
                sidebarCompact ? "Expandir barra lateral" : "Compactar barra lateral"
              }
              onClick={() => setSidebarCompact((current) => !current)}
              className={cn(
                "hidden border border-white/[0.08] bg-white/[0.03] text-white/45 hover:bg-white/[0.06] hover:text-white lg:inline-flex",
                sidebarCompact ? "rounded-xl" : "rounded-xl",
              )}
            >
              {sidebarCompact ? (
                <ChevronsRight className="size-4" />
              ) : (
                <ChevronsLeft className="size-4" />
              )}
            </Button>
          </div>
          {!sidebarCompact && (
            <div className="mt-10 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
              {esEntrenador ? "Workspace" : "Entrenamiento"}
            </div>
          )}
          <nav className={cn("space-y-1.5", sidebarCompact ? "mt-6" : "mt-3")}>
            {navegacion.map((item) => {
              const NavIcon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  title={item.label}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "group flex w-full rounded-2xl transition-colors",
                    sidebarCompact
                      ? "justify-center px-0 py-3"
                      : "items-center gap-3 px-3 py-3.5",
                    (esEntrenador
                      ? item.view === vistaEntrenador
                      : item.view === vistaAtleta)
                      ? "bg-indigo-300/10 text-white"
                      : "text-indigo-100/45 hover:bg-indigo-300/[0.07] hover:text-white/80",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.035]">
                    <NavIcon className="size-4" />
                  </span>
                  {!sidebarCompact && (
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="mt-0.5 block text-[10px] text-white/25 transition-colors group-hover:text-white/40">
                        {item.description}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div
            className={cn(
              "mt-auto rounded-2xl border border-indigo-200/[0.08] bg-indigo-300/[0.06] p-3.5",
              sidebarCompact && "px-2.5",
            )}
          >
            <div
              className={cn(
                "flex items-center",
                sidebarCompact ? "justify-center" : "gap-3",
              )}
            >
              <BlobatarAvatar
                name={usuario.email}
                size={sidebarCompact ? "sm" : "lg"}
              />
              {!sidebarCompact && (
                <div className="min-w-0">
                  <div className="truncate text-sm">{usuario.name}</div>
                  <div className="text-[10px] text-indigo-100/35">
                    {esEntrenador ? "Entrenador" : "Atleta"}
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={onLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className={cn(
                "mt-3 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-xs text-white/55 hover:bg-white/[0.07] hover:text-white",
                sidebarCompact ? "w-full justify-center" : "w-full justify-between",
              )}
            >
              {!sidebarCompact && <span>Cerrar sesión</span>}
              <LogOut className="size-4" />
            </Button>
            <VersionLabel className="mt-3 block text-center" />
          </div>
        </aside>
      )}

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#07080b]/88 px-4 backdrop-blur-xl lg:h-18 lg:px-8",
          workoutImmersive && "hidden",
          !vistaPrevia &&
            (sidebarCompact ? "lg:left-24 lg:hidden" : "lg:left-64 lg:hidden"),
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(!vistaPrevia && "hidden lg:block")}>
            <Logo />
          </div>
          <div className="flex items-center gap-3 lg:hidden">
            <Image
              src="/rttp-mark-v2.png"
              alt=""
              width={28}
              height={28}
              unoptimized
              className="size-7 object-contain drop-shadow-[0_0_10px_rgba(99,102,241,.18)]"
            />
            {!vistaPrevia && (
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85">
                  RTTP <VersionLabel className="ml-1 align-middle" />
                </div>
                <div className="truncate text-[11px] text-white/40">
                  {encabezado[0]}
                </div>
              </div>
            )}
          </div>
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
        <div className="flex items-center gap-2">
          {!vistaPrevia && (
            <div
              className={cn(
                "hidden text-right sm:block",
                esEntrenador && "lg:hidden",
              )}
            >
              <div className="text-[11px]">{usuario.name}</div>
              <div className="text-[9px] text-white/30">
                {usuario.role === "coach" ? "Entrenador" : "Atleta"}
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
          "relative min-h-screen pt-16 lg:pt-18",
          workoutImmersive && "pt-0 lg:pt-0",
          !vistaPrevia &&
            !workoutImmersive &&
            (sidebarCompact ? "lg:pl-24 lg:pt-0" : "lg:pl-64 lg:pt-0"),
          !vistaPrevia &&
            !esEntrenador &&
            !workoutImmersive &&
            "pb-24 lg:pb-0",
        )}
      >
        {syncError && !workoutImmersive && (
          <div
            role="alert"
            className="relative z-20 mx-auto max-w-[1760px] px-4 pt-4 sm:px-6 lg:px-10"
          >
            <p className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">
              No pudimos sincronizar con la base de datos. {syncError}
            </p>
          </div>
        )}
        {vistaPrevia && (
          <div className="mx-auto max-w-[1760px] px-4 pt-6 sm:px-6 lg:px-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClosePreview}
              className="-ml-3 rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"
            >
              <ArrowLeft />
              Volver a editar
            </Button>
          </div>
        )}
        {children}
      </main>
      {!esEntrenador && !vistaPrevia && !workoutImmersive && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-[#07080b]/96 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.03] p-1.5 shadow-[0_-18px_45px_rgba(4,8,18,.35)]">
            {navegacionAtleta.map((item) => {
              const NavIcon = item.icon;
              const activo = item.view === vistaAtleta;
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-label={item.label}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-center transition-colors",
                    activo
                      ? "bg-cyan-300/12 text-cyan-100"
                      : "text-white/35 hover:bg-white/[0.06] hover:text-white/80",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-full border transition-colors",
                      activo
                        ? "border-cyan-200/20 bg-cyan-300/12"
                        : "border-white/[0.06] bg-white/[0.03]",
                    )}
                  >
                    <NavIcon className="size-4" />
                  </span>
                  <span className="truncate text-[10px] font-medium leading-none">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function SelectorRutina({
  routines,
  rutinaActiva,
  onSelect,
  desktopVertical = false,
}: {
  routines: Routine[];
  rutinaActiva: Routine;
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
      {routines.map((rutina, index) => (
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
          <div className="flex items-start justify-between gap-2">
            <div
              className={cn(
                "truncate text-sm font-medium",
                desktopVertical && "xl:text-base",
              )}
            >
              {rutina.title}
            </div>
            {cantidadEjercicios(rutina) === 0 && (
              <span className="shrink-0 rounded-full border border-amber-300/15 bg-amber-300/10 px-2 py-0.5 text-[9px] text-amber-100/80">
                Vacía
              </span>
            )}
          </div>
          <div
            className={cn(
              "mt-1 text-[10px] text-indigo-100/35",
              desktopVertical && "xl:mt-2 xl:text-xs",
            )}
          >
            {cantidadEjercicios(rutina)} ejercicios
          </div>
        </button>
      ))}
    </div>
  );
}

function FilaEjercicio({
  item,
  blockId,
  onUpdate,
  onDelete,
}: {
  item: Exercise;
  blockId: string;
  onUpdate: (item: Exercise) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { blockId } });

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
          aria-label={`Arrastrar ${item.name}`}
          className="touch-none cursor-grab rounded-lg p-1 text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/55 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-violet-300/10 text-[10px] font-medium text-violet-100/60 xl:size-10 xl:text-xs">
          {item.name
            .split(" ")
            .map((palabra) => palabra[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm xl:text-base">{item.name}</div>
          <Input
            value={item.instructions}
            onChange={(event) =>
              onUpdate({ ...item, instructions: event.target.value })
            }
            aria-label={`Aclaraciones de ${item.name}`}
            placeholder="+ Aclaración opcional"
            className="mt-1 h-5 rounded-none border-0 bg-transparent p-0 text-[10px] text-violet-100/55 shadow-none placeholder:text-white/20 focus-visible:ring-0 dark:bg-transparent xl:text-xs"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 md:justify-start">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              onUpdate({ ...item, sets: Math.max(1, item.sets - 1) })
            }
            className="rounded-full text-indigo-100/40 hover:bg-indigo-300/10 hover:text-white"
            aria-label={`Quitar una serie de ${item.name}`}
          >
            <Minus />
          </Button>
          <div className="w-10 text-center">
            <div className="text-sm">{item.sets}</div>
            <div className="text-[8px] uppercase text-indigo-100/25">series</div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onUpdate({ ...item, sets: item.sets + 1 })}
            className="rounded-full text-indigo-100/40 hover:bg-indigo-300/10 hover:text-white"
            aria-label={`Agregar una serie a ${item.name}`}
          >
            <Plus />
          </Button>
        </div>
        <div className="space-y-1">
          <div
            role="group"
            aria-label={`Tipo de repeticiones de ${item.name}`}
            className="grid h-8 w-32 grid-cols-2 rounded-lg border border-white/10 bg-black/25 p-0.5"
          >
            {(["fijas", "rango"] as const).map((tipo) => {
              const seleccionado =
                tipo === "fijas"
                  ? item.minReps === item.maxReps
                  : item.minReps !== item.maxReps;
              return (
                <button
                  key={tipo}
                  type="button"
                  aria-pressed={seleccionado}
                  onClick={() => {
                    if (tipo === "fijas") {
                      onUpdate({
                        ...item,
                        maxReps: item.minReps,
                      });
                      return;
                    }
                    onUpdate({
                      ...item,
                      maxReps: Math.max(
                        item.minReps + 1,
                        item.maxReps,
                      ),
                    });
                  }}
                  className={cn(
                    "rounded-md text-[9px] transition-colors",
                    seleccionado
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-white/35 hover:text-white/65",
                  )}
                >
                  {tipo === "fijas" ? "Fijas" : "Rango"}
                </button>
              );
            })}
          </div>
          {item.minReps === item.maxReps ? (
            <label className="block w-32 text-center">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={item.minReps}
                onChange={(event) => {
                  const reps = Math.max(0, Number(event.target.value));
                  onUpdate({
                    ...item,
                    minReps: reps,
                    maxReps: reps,
                  });
                }}
                aria-label={`Repeticiones de ${item.name}`}
                className="h-8 border-white/10 bg-black/25 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div className="mt-1 text-[8px] uppercase text-indigo-100/25">
                reps.
              </div>
            </label>
          ) : (
            <div className="flex gap-1">
              <label className="w-16 text-center">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={item.minReps}
                  onChange={(event) =>
                    onUpdate({
                      ...item,
                      minReps: Math.min(
                        item.maxReps,
                        Math.max(0, Number(event.target.value)),
                      ),
                    })
                  }
                  aria-label={`Repeticiones mínimas de ${item.name}`}
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
                  min={item.minReps}
                  value={item.maxReps}
                  onChange={(event) =>
                    onUpdate({
                      ...item,
                      maxReps: Math.max(
                        item.minReps,
                        Number(event.target.value),
                      ),
                    })
                  }
                  aria-label={`Repeticiones máximas de ${item.name}`}
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
            value={item.weight}
            onChange={(event) =>
              onUpdate({
                ...item,
                weight: Math.max(0, Number(event.target.value)),
              })
            }
            aria-label={`Peso de ${item.name}`}
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
            value={item.restSeconds ?? ""}
            onChange={(event) =>
              onUpdate({
                ...item,
                restSeconds:
                  event.target.value === ""
                    ? null
                    : Math.max(0, Number(event.target.value)),
              })
            }
            aria-label={`Descanso de ${item.name}`}
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
        aria-label={`Eliminar ${item.name}`}
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
  addExercise,
  children,
}: {
  bloque: Block;
  index: number;
  abierto: boolean;
  onToggle: () => void;
  addExercise: React.ReactNode;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `bloque:${bloque.id}`,
    data: { blockId: bloque.id },
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
          <span className="text-xs font-medium xl:text-sm">{bloque.name}</span>
          <span className="hidden text-[9px] text-white/30 sm:inline xl:text-[10px]">
            {blockTypeLabel(bloque.type)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-wider text-white/30">
            {rondasDelBloque(bloque)}{" "}
            {rondasDelBloque(bloque) === 1 ? "ronda" : "rondas"}
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
          items={bloque.exercises.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="py-1">
            {children}
            <div className="m-3">{addExercise}</div>
          </div>
        </SortableContext>
      )}
    </div>
  );
}

function DialogoEjercicio({
  blocks,
  trigger,
  initialBlockId,
  onAdd,
}: {
  blocks: Block[];
  trigger: React.ReactElement;
  initialBlockId: string;
  onAdd: (item: Exercise, blockId: string, nuevoBloque?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setNombre] = useState("");
  const [sets, setSeries] = useState("3");
  const [modoRepeticiones, setModoRepeticiones] = useState<"fijas" | "rango">(
    "fijas",
  );
  const [reps, setRepeticiones] = useState("10");
  const [minReps, setRepeticionesMin] = useState("10");
  const [maxReps, setRepeticionesMax] = useState("10");
  const [weight, setPeso] = useState("0");
  const [restSeconds, setDescanso] = useState("");
  const [instructions, setAclaraciones] = useState("");
  const [blockId, setBloqueId] = useState(initialBlockId);
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
    setBloqueId(initialBlockId);
    setNuevoBloque("");
  }

  function agregar() {
    if (!name.trim()) return;
    onAdd(
      {
        id: `${name.toLowerCase().replace(/\W+/g, "-")}-${Date.now()}`,
        name: name.trim(),
        sets: Math.max(1, Number(sets) || 1),
        minReps: Math.max(
          0,
          Number(
            modoRepeticiones === "fijas" ? reps : minReps,
          ) || 0,
        ),
        maxReps:
          modoRepeticiones === "fijas"
            ? Math.max(0, Number(reps) || 0)
            : Math.max(
                Number(minReps) || 0,
                Number(maxReps) || 0,
              ),
        weight: Math.max(0, Number(weight) || 0),
        restSeconds:
          restSeconds.trim() === "" ? null : Math.max(0, Number(restSeconds)),
        instructions: instructions.trim(),
      },
      blockId,
      nuevoBloque.trim() || `Bloque ${blocks.length + 1}`,
    );
  }

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger render={trigger} />
      <DialogContent className="border-violet-200/15 bg-[#111217] text-white">
        <DialogHeader>
          <DialogTitle>
            {initialBlockId === "nuevo" ? "Nuevo bloque" : "Nuevo ejercicio"}
          </DialogTitle>
          <DialogDescription className="text-indigo-100/45">
            {initialBlockId === "nuevo"
              ? "Creá el bloque junto con su primer ejercicio."
              : `Se agregará a ${blocks.find((block) => block.id === initialBlockId)?.name ?? "este bloque"}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <label className="space-y-2">
            <span className="text-xs text-indigo-100/55">Nombre</span>
            <Input
              value={name}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Peso muerto"
              className="border-white/10 bg-black/35"
            />
          </label>
          {blockId === "nuevo" && (
            <label className="block space-y-2">
              <span className="text-xs text-indigo-100/55">
                Nombre del nuevo bloque (opcional)
              </span>
              <Input
                value={nuevoBloque}
                onChange={(event) => setNuevoBloque(event.target.value)}
                placeholder={`Bloque ${blocks.length + 1}`}
                className="border-white/10 bg-black/35"
              />
            </label>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ["Series", sets, setSeries],
              ["Peso", weight, setPeso],
              ["Descanso", restSeconds, setDescanso],
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
                  value={reps}
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
                    value={minReps}
                    onChange={(event) => setRepeticionesMin(event.target.value)}
                    className="border-white/10 bg-black/35"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs text-indigo-100/55">Máximas</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={Number(minReps) || 0}
                    value={maxReps}
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
              value={instructions}
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
                disabled={!name.trim()}
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
  atleta: User;
  onCreate: (rutina: Routine) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitulo] = useState("");
  const [objective, setObjetivo] = useState("");
  const [durationMinutes, setDuracion] = useState("");

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (siguiente) return;
    setTitulo("");
    setObjetivo("");
    setDuracion("");
  }

  function crear() {
    if (!title.trim()) return;

    const timestamp = Date.now();
    onCreate({
      id: `rutina-${atleta.id}-${timestamp}`,
      athleteId: atleta.id,
      title: title.trim(),
      objective: objective.trim() || "Entrenamiento personalizado",
      durationMinutes: durationMinutes.trim()
        ? Math.max(1, Number(durationMinutes))
        : null,
      blocks: [
        {
          id: `bloque-${timestamp}`,
          name: "Bloque 1",
          type: "custom",
          exercises: [],
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
          <DialogTitle>Crear rutina para {atleta.name}</DialogTitle>
          <DialogDescription className="text-white/40">
            Empezá con un bloque vacío y completá los demás datos cuando quieras.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Nombre</span>
            <Input
              autoFocus
              value={title}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Ej. Potencia"
              className="border-white/10 bg-black/35"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Objetivo (opcional)</span>
            <Input
              value={objective}
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
              value={durationMinutes}
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
                  disabled={!title.trim()}
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
  rutina: Routine;
  onUpdate: (rutina: Routine) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitulo] = useState(rutina.title);
  const [objective, setObjetivo] = useState(rutina.objective);
  const [durationMinutes, setDuracion] = useState(
    String(rutina.durationMinutes ?? ""),
  );

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (!siguiente) return;
    setTitulo(rutina.title);
    setObjetivo(
      rutina.objective === "Entrenamiento personalizado" ? "" : rutina.objective,
    );
    setDuracion(String(rutina.durationMinutes ?? ""));
  }

  function guardar() {
    if (!title.trim()) return;
    onUpdate({
      ...rutina,
      title: title.trim(),
      objective: objective.trim() || "Entrenamiento personalizado",
      durationMinutes: durationMinutes.trim()
        ? Math.max(1, Number(durationMinutes))
        : null,
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
              value={title}
              onChange={(event) => setTitulo(event.target.value)}
              className="border-white/10 bg-black/35"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Objetivo (opcional)</span>
            <Input
              value={objective}
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
              value={durationMinutes}
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
            disabled={!title.trim()}
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
  plantilla: RoutineTemplate;
  atletas: User[];
  onAssign: (athleteId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [athleteId, setAtletaId] = useState(String(atletas[0]?.id ?? ""));

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (siguiente) setAtletaId(String(atletas[0]?.id ?? ""));
  }

  function asignar() {
    const id = Number(athleteId);
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
          <DialogTitle>Asignar “{plantilla.title}”</DialogTitle>
          <DialogDescription className="text-white/40">
            Se creará una copia independiente para el atleta, lista para
            personalizar pesos y detalles.
          </DialogDescription>
        </DialogHeader>
        <label className="block space-y-2">
          <span className="text-xs text-white/55">Atleta</span>
          <select
            value={athleteId}
            onChange={(event) => setAtletaId(event.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none focus:border-cyan-300/40"
          >
            {atletas.map((atleta) => (
              <option key={atleta.id} value={atleta.id}>
                {atleta.name}
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
            disabled={!athleteId}
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
  users,
  onCreate,
}: {
  users: User[];
  onCreate: (name: string, email: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false);

  function cambiarApertura(siguiente: boolean) {
    if (!siguiente && creando) return;
    setOpen(siguiente);
    if (siguiente) return;
    setNombre("");
    setEmail("");
    setError("");
  }

  async function crear() {
    const emailNormalizado = email.trim().toLowerCase();
    if (
      users.some(
        (item) => item.email.toLowerCase() === emailNormalizado,
      )
    ) {
      setError("Ya existe un usuario con ese email.");
      return;
    }
    setCreando(true);
    const errorCreacion = await onCreate(name.trim(), emailNormalizado);
    setCreando(false);
    if (errorCreacion) {
      setError(errorCreacion);
      return;
    }
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
              value={name}
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
              disabled={!name.trim() || !email.trim() || creando}
              className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
            >
              {creando ? "Guardando..." : "Agregar alumno"}
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
  rutina: Routine;
  onSelectAtleta: (id: number) => void;
  onSelect: (id: string) => void;
  onSaveRutina: (rutina: Routine) => void;
  onCreateRutina: (rutina: Routine) => void;
  onSaveAsTemplate: (rutina: Routine) => void;
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
  const [rutina, setRutina] = useState(rutinaGuardada);
  const [seccionDetalle, setSeccionDetalle] = useState<
    "routines" | "agenda" | "activities"
  >("routines");
  const [bloqueAbierto, setBloqueAbierto] = useState<string | null>(null);
  const [accionPendiente, setAccionPendiente] = useState<(() => void) | null>(
    null,
  );
  const [guardadoVisible, setGuardadoVisible] = useState(false);
  const hayCambios =
    JSON.stringify(rutina) !== JSON.stringify(rutinaGuardada);
  const ejerciciosRutinaActiva = cantidadEjercicios(rutina);
  const rutinasSinEjercicios = rutinasPorAtleta.filter(
    (item) => cantidadEjercicios(item) === 0,
  );
  const atletasConRutinasIncompletas = atletas.filter((atletaActual) =>
    rutinasPorAtleta.some(
      (rutinaActual) =>
        rutinaActual.athleteId === atletaActual.id &&
        cantidadEjercicios(rutinaActual) === 0,
    ),
  );
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
    blockId: string,
    exerciseId: string,
    siguiente: Exercise,
  ) {
    setRutina((actual) => ({
      ...actual,
      blocks: actual.blocks.map((bloque) =>
        bloque.id === blockId
          ? {
              ...bloque,
              exercises: bloque.exercises.map((item) =>
                item.id === exerciseId ? siguiente : item,
              ),
            }
          : bloque,
      ),
    }));
  }

  function eliminarEjercicio(blockId: string, exerciseId: string) {
    setRutina((actual) => ({
      ...actual,
      blocks: actual.blocks.map((bloque) =>
        bloque.id === blockId
          ? {
              ...bloque,
              exercises: bloque.exercises.filter(
                (item) => item.id !== exerciseId,
              ),
            }
          : bloque,
      ),
    }));
  }

  function agregarEjercicio(
    item: Exercise,
    blockId: string,
    nuevoBloque?: string,
  ) {
    if (blockId === "nuevo" && nuevoBloque) {
      const id = `bloque-${Date.now()}`;
      setRutina((actual) => ({
        ...actual,
        blocks: [
          ...actual.blocks,
          {
            id,
            name: nuevoBloque,
            type: "custom",
            exercises: [item],
          },
        ],
      }));
      setBloqueAbierto(id);
      return;
    }

    setRutina((actual) => ({
      ...actual,
      blocks: actual.blocks.map((bloque) =>
        bloque.id === blockId
          ? { ...bloque, exercises: [...bloque.exercises, item] }
          : bloque,
      ),
    }));
    setBloqueAbierto(blockId);
  }

  function moverEjercicio(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const bloqueOrigenId = active.data.current?.blockId as string | undefined;
    const bloqueDestinoId = (
      String(over.id).startsWith("bloque:")
        ? String(over.id).replace("bloque:", "")
        : over.data.current?.blockId
    ) as string | undefined;

    if (!bloqueOrigenId || !bloqueDestinoId) return;

    setRutina((actual) => {
      const bloqueOrigen = actual.blocks.find(
        (bloque) => bloque.id === bloqueOrigenId,
      );
      const bloqueDestino = actual.blocks.find(
        (bloque) => bloque.id === bloqueDestinoId,
      );
      if (!bloqueOrigen || !bloqueDestino) return actual;

      const indiceOrigen = bloqueOrigen.exercises.findIndex(
        (item) => item.id === active.id,
      );
      if (indiceOrigen < 0) return actual;

      if (bloqueOrigenId === bloqueDestinoId) {
        const indiceDestino = String(over.id).startsWith("bloque:")
          ? bloqueOrigen.exercises.length - 1
          : bloqueOrigen.exercises.findIndex((item) => item.id === over.id);
        if (indiceDestino < 0 || indiceDestino === indiceOrigen) return actual;
        return {
          ...actual,
          blocks: actual.blocks.map((bloque) =>
            bloque.id === bloqueOrigenId
              ? {
                  ...bloque,
                  exercises: arrayMove(
                    bloque.exercises,
                    indiceOrigen,
                    indiceDestino,
                  ),
                }
              : bloque,
          ),
        };
      }

      const itemMovido = bloqueOrigen.exercises[indiceOrigen];
      const indiceDestino = String(over.id).startsWith("bloque:")
        ? bloqueDestino.exercises.length
        : Math.max(
            0,
            bloqueDestino.exercises.findIndex((item) => item.id === over.id),
          );

      return {
        ...actual,
        blocks: actual.blocks.map((bloque) => {
          if (bloque.id === bloqueOrigenId) {
            return {
              ...bloque,
              exercises: bloque.exercises.filter(
                (item) => item.id !== active.id,
              ),
            };
          }
          if (bloque.id === bloqueDestinoId) {
            const exercises = [...bloque.exercises];
            exercises.splice(indiceDestino, 0, itemMovido);
            return { ...bloque, exercises };
          }
          return bloque;
        }),
      };
    });
    setBloqueAbierto(bloqueDestinoId);
  }

  function crearYEditar(rutinaNueva: Routine) {
    onCreateRutina(rutinaNueva);
    setBloqueAbierto(rutinaNueva.blocks[0].id);
  }

  return (
    <div
      id="inicio-entrenador"
      className={cn(desktopPageShellClassName, "scroll-mt-24")}
    >
      {vista === "resumen" && (
        <section>
          <div className="mb-8">
            <div className={pageEyebrowClassName}>
              Workspace de entrenamiento
            </div>
            <h1 className={pageTitleClassName}>
              Planificá el progreso de tus atletas
            </h1>
            <p className={pageDescriptionClassName}>
              Organizá atletas, reutilizá plantillas y personalizá cada plan desde
              sus espacios dedicados.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [atletas.length, "Atletas", "Gestioná sus perfiles"],
              [templates.length, "Plantillas propias", "Reutilizables"],
              [rutinasPorAtleta.length, "Planes asignados", "En todos tus atletas"],
              [
                rutinasSinEjercicios.length,
                "Rutinas a revisar",
                rutinasSinEjercicios.length === 0
                  ? "Todo el contenido está cargado"
                  : "Todavía les faltan ejercicios",
              ],
            ].map(([cantidad, title, detalle]) => (
              <div
                key={title as string}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-4"
              >
                <div className="text-2xl font-light">{cantidad as number}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-white/45">
                  {title as string}
                </div>
                <div className="mt-1 text-[10px] text-white/25">
                  {detalle as string}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <button
              type="button"
              onClick={() => navigate("/coach/athletes")}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left transition-colors hover:bg-white/[0.04]"
            >
              <div className="text-sm font-medium">Seguí con tus atletas</div>
              <p className="mt-1 text-xs leading-relaxed text-white/35">
                Entrá directo a la planificación individual y revisá cargas,
                agenda y actividades.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs text-cyan-100">
                Abrir atletas
                <ArrowRight className="size-3.5" />
              </div>
            </button>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="text-sm font-medium">Rutinas para completar</div>
              <p className="mt-1 text-xs leading-relaxed text-white/35">
                {atletasConRutinasIncompletas.length === 0
                  ? "No hay atletas con rutinas vacías. Todo el contenido base ya está cargado."
                  : `${atletasConRutinasIncompletas.length} atleta${atletasConRutinasIncompletas.length === 1 ? "" : "s"} tiene${atletasConRutinasIncompletas.length === 1 ? "" : "n"} al menos una rutina sin ejercicios.`}
              </p>
              <button
                type="button"
                onClick={() => navigate("/coach/routines")}
                className="mt-4 inline-flex items-center gap-2 text-xs text-cyan-100"
              >
                Ir a plantillas y rutinas
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {vista === "atletas" && !detalleAtleta && (
        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className={pageEyebrowClassName}>Tus atletas</div>
              <h1 className={pageTitleClassName}>Seguimiento individual</h1>
              <p className={pageDescriptionClassName}>
                Revisá la carga, detectá rutinas incompletas y entrá rápido a la
                planificación de cada atleta.
              </p>
            </div>
            <DialogoNuevoAtleta users={users} onCreate={onCreateAtleta} />
          </div>
          <div className="rounded-3xl border border-white/[0.07] bg-[#0d0e13]/70 p-4 md:p-5 xl:p-6">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
            {atletas.map((item) => {
              const planes = rutinasPorAtleta.filter(
                (rutinaActual) => rutinaActual.athleteId === item.id,
              );
              const exercises = planes.reduce(
                (total, rutinaActual) =>
                  total + cantidadEjercicios(rutinaActual),
                0,
              );
              const rutinasIncompletas = planes.filter(
                (rutinaActual) => cantidadEjercicios(rutinaActual) === 0,
              ).length;

              return (
                <div
                  key={item.id}
                  className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{item.name}</div>
                        <div className="truncate text-[10px] text-white/30">{item.email}</div>
                      </div>
                      {rutinasIncompletas > 0 && (
                        <Badge className="shrink-0 border-amber-300/15 bg-amber-300/10 text-[9px] text-amber-100/80">
                          {rutinasIncompletas} sin completar
                        </Badge>
                      )}
                    </div>
                    {rutinasIncompletas > 0 && (
                      <div className="mt-3 rounded-xl border border-amber-300/10 bg-amber-300/[0.05] px-3 py-2 text-[10px] text-amber-100/70">
                        Revisá las rutinas vacías antes de asignar nuevas cargas.
                      </div>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white/[0.035] px-3 py-2">
                      <div className="text-sm">{planes.length}</div>
                      <div className="text-[9px] uppercase tracking-wider text-white/30">
                        Planes
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/[0.035] px-3 py-2">
                      <div className="text-sm">{exercises}</div>
                      <div className="text-[9px] uppercase tracking-wider text-white/30">
                        Ejercicios
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAtleta(item.id);
                      navigate(`/coach/athletes/${item.id}`);
                    }}
                    className="mt-4 flex h-9 items-center justify-center gap-2 rounded-full bg-cyan-300 text-xs font-medium text-indigo-950 transition-colors hover:bg-cyan-200"
                  >
                    Ver planificación
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              );
            })}
            </div>
          </div>
        </section>
      )}

      {vista === "routines" && (
        <section>
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
            <div className={pageEyebrowClassName}>Biblioteca de plantillas</div>
            <h1 className={pageTitleClassName}>Rutinas reutilizables</h1>
            <p className={pageDescriptionClassName}>
              Guardá la rutina abierta como plantilla para reutilizar su estructura y pesos base. Cada asignación crea una copia independiente para el atleta.
            </p>
            </div>
            <Button
            variant="outline"
            onClick={() => onSaveAsTemplate(rutina)}
            disabled={ejerciciosRutinaActiva === 0}
            title={
              ejerciciosRutinaActiva === 0
                ? "Agregá al menos un ejercicio antes de guardarla como plantilla"
                : "Guardar como plantilla"
            }
            className="self-start shrink-0 rounded-full border-indigo-200/10 bg-indigo-300/[0.05] text-white hover:bg-indigo-300/10 hover:text-white xl:self-auto"
            >
            <Plus />
            Guardar como plantilla
            </Button>
          </div>
          <div className="rounded-3xl border border-white/[0.07] bg-[#0d0e13]/70 p-4 md:p-5 xl:p-6">
            {templates.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-5 text-xs text-white/35">
              Todavía no tenés plantillas. Personalizá una rutina y guardala acá
              para asignarla rápidamente.
            </div>
            ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((plantilla) => (
                <div
                  key={plantilla.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {plantilla.title}
                      </div>
                    </div>
                    <Badge className="shrink-0 border-white/[0.08] bg-white/[0.04] text-[9px] text-white/45">
                      Plantilla
                    </Badge>
                  </div>
                  <div className="mt-2 text-[10px] text-white/30">
                    {cantidadEjercicios(plantilla)} ejercicios
                    {plantilla.durationMinutes
                      ? ` · ${plantilla.durationMinutes} min`
                      : ""}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <DialogoAsignarPlantilla
                      plantilla={plantilla}
                      atletas={atletas}
                      onAssign={(athleteId) =>
                        navegar(() => onAssignTemplate(plantilla.id, athleteId))
                      }
                    />
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Eliminar plantilla ${plantilla.title}`}
                            className="rounded-full text-white/35 hover:bg-red-400/10 hover:text-red-200"
                          />
                        }
                      >
                        <Trash2 />
                      </DialogTrigger>
                      <DialogContent className="border-white/10 bg-[#111217] text-white">
                        <DialogHeader>
                          <DialogTitle>
                            ¿Eliminar “{plantilla.title}”?
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
          </div>
        </section>
      )}

      {detalleAtleta && (
        <section id="routines-entrenador" className="scroll-mt-24">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
            <button
              type="button"
              onClick={() => navigate("/coach/athletes")}
              className="mb-3 inline-flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-3.5" />
              Todos los atletas
            </button>
            <div className={pageEyebrowClassName}>
              Planificación de {atleta.name}
            </div>
            <h1 className={pageTitleClassName}>
              {seccionDetalle === "routines"
                ? "Plan de entrenamiento"
                : seccionDetalle === "agenda"
                  ? "Agenda deportiva"
                  : "Actividades realizadas"}
            </h1>
            <p className={pageDescriptionClassName}>
              {seccionDetalle === "routines"
                ? "Armá bloques, completá ejercicios y ajustá la estructura antes de asignar nuevas cargas."
                : seccionDetalle === "agenda"
                  ? "Programá sesiones internas y externas para darle contexto semanal al plan del atleta."
                  : "Revisá lo que ya completó y corregí registros externos incluso después de realizarlos."}
            </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
            {seccionDetalle === "routines" && (
              <DialogoNuevaRutina atleta={atleta} onCreate={crearYEditar} />
            )}
            <Button
              onClick={() => navegar(verComoAtleta)}
              className="rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
            >
              Vista atleta
              <ArrowRight />
            </Button>
            </div>
          </div>

        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.025] p-1 sm:w-fit">
          {[
            ["routines", "Rutinas", Dumbbell],
            ["agenda", "Agenda", CalendarDays],
            ["activities", "Actividades", Activity],
          ].map(([value, label, Icon]) => {
            const TabIcon = Icon as typeof Dumbbell;
            return (
              <button
                key={value as string}
                onClick={() =>
                  navegar(() =>
                    setSeccionDetalle(
                      value as "routines" | "agenda" | "activities",
                    ),
                  )
                }
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs transition-colors",
                  seccionDetalle === value
                    ? "bg-white/[0.09] text-white"
                    : "text-white/35 hover:text-white/65",
                )}
              >
                <TabIcon className="size-3.5" />
                {label as string}
              </button>
            );
          })}
        </div>

        {seccionDetalle === "routines" && (
        <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-6">
          <div className="xl:sticky xl:top-24">
            <div className="mb-3 hidden items-center justify-between xl:flex">
              <span className="text-xs font-medium text-white/60">
                Rutinas asignadas
              </span>
              <span className="text-[10px] text-white/25">
                {routines.length} planes
              </span>
            </div>
            <SelectorRutina
              routines={routines}
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
                    {rutina.title}
                  </div>
                  <p className="mt-1 text-[11px] text-indigo-100/35 xl:text-xs">
                    <TextWithLinks>{rutina.objective}</TextWithLinks>
                    {rutina.durationMinutes
                      ? ` · ${rutina.durationMinutes} min`
                      : ""}{" "}
                    · {ejerciciosRutinaActiva} ejercicios
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {!hayCambios && (
                    <div className="flex items-center gap-1 text-[10px] text-cyan-200/55">
                      <Check className="size-3" />
                      {guardadoVisible ? "Cambios guardados" : "Guardado"}
                    </div>
                  )}
                  <DialogoDetallesRutina
                        rutina={rutina}
                        onUpdate={setRutina}
                  />
                  {hayCambios && (
                    <Button
                      onClick={guardar}
                      className="rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-[0_10px_30px_rgba(79,70,229,.2)] hover:brightness-110"
                    >
                      <Check />
                      Guardar cambios
                    </Button>
                  )}
                  <Dialog>
                    <DialogTrigger
                      disabled={routines.length <= 1}
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar rutina"
                          title={
                            routines.length <= 1
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
                        <DialogTitle>¿Eliminar “{rutina.title}”?</DialogTitle>
                        <DialogDescription className="text-white/40">
                          La rutina dejará de estar disponible para {atleta.name}.
                          También se quitarán sus entrenamientos programados. Esta
                          acción no se puede deshacer.
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
              {ejerciciosRutinaActiva === 0 && (
                <div className="mt-4 rounded-2xl border border-amber-300/12 bg-amber-300/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-100/75">
                  Esta rutina todavía no tiene ejercicios. Sumá contenido antes de
                  usarla como referencia o seguir avanzando con la planificación del atleta.
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={moverEjercicio}
              >
                {rutina.blocks.map((bloque, index) => (
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
                    addExercise={
                      <DialogoEjercicio
                        blocks={rutina.blocks}
                        initialBlockId={bloque.id}
                        trigger={
                          <button
                            type="button"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-200/15 bg-cyan-300/[0.025] px-4 py-3 text-xs text-cyan-100/55 transition-colors hover:border-cyan-200/30 hover:bg-cyan-300/[0.06] hover:text-cyan-100"
                          >
                            <Plus className="size-3.5" />
                            Sumar ejercicio
                          </button>
                        }
                        onAdd={agregarEjercicio}
                      />
                    }
                  >
                    {bloque.exercises.map((item) => (
                      <FilaEjercicio
                        key={item.id}
                        item={item}
                        blockId={bloque.id}
                        onUpdate={(siguiente) =>
                          actualizarEjercicio(bloque.id, item.id, siguiente)
                        }
                        onDelete={() => eliminarEjercicio(bloque.id, item.id)}
                      />
                    ))}
                  </BloqueEditor>
                ))}
                <div className="border-t border-white/[0.06] p-3">
                  <DialogoEjercicio
                    blocks={rutina.blocks}
                    initialBlockId="nuevo"
                    trigger={
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-200/15 bg-violet-300/[0.025] px-4 py-4 text-xs text-violet-100/55 transition-colors hover:border-violet-200/30 hover:bg-violet-300/[0.06] hover:text-violet-100"
                      >
                        <Plus className="size-3.5" />
                        Crear bloque
                      </button>
                    }
                    onAdd={agregarEjercicio}
                  />
                </div>
              </DndContext>
            </CardContent>
          </Card>
        </div>
        )}
        {seccionDetalle === "agenda" && (
        <SportsSchedule
          embedded
          modoCoach
          atleta={atleta}
          usuarioActual={entrenador}
          routines={routines}
          workouts={workouts}
          onCreate={onCreateEntrenamiento}
          onUpdate={onUpdateEntrenamiento}
          onDelete={onDeleteEntrenamiento}
          onStart={() => undefined}
        />
        )}
        {seccionDetalle === "activities" && (
        <ActivityHistory
          embedded
          activities={activities}
        />
        )}
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

function OverviewRutina({
  rutina,
  className,
}: {
  rutina: Routine;
  className?: string;
}) {
  const ejercicios = cantidadEjercicios(rutina);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full border border-white/10 bg-black/20 text-[10px] text-white/60 hover:bg-white/[0.08] hover:text-white",
              className,
            )}
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
            {rutina.title}
          </DialogTitle>
          <DialogDescription className="text-white/40">
            {rutina.blocks.length} bloques conectados ·{" "}
            {ejercicios} ejercicios
            {rutina.durationMinutes ? ` · ${rutina.durationMinutes} min` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(88vh-9rem)] overflow-y-auto px-4 py-6 md:px-8">
          {ejercicios === 0 ? (
            <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.02] px-6 text-center">
              <div>
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-300/[0.08] text-amber-100/70">
                  <Dumbbell className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-medium">Rutina en preparación</h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-white/38">
                  Tu entrenador todavía no cargó ejercicios en esta rutina. Cuando la complete,
                  vas a poder revisar el detalle y arrancarla desde la app.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative before:absolute before:bottom-5 before:left-[19px] before:top-5 before:w-px before:bg-gradient-to-b before:from-cyan-300/60 before:via-violet-400/45 before:to-blue-400/25 md:before:left-1/2">
                {rutina.blocks.map((bloque, index) => (
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
                            {bloque.name}
                          </h3>
                        </div>
                        <Badge className="border-white/10 bg-black/25 text-[8px] text-white/45">
                          {rondasDelBloque(bloque)}{" "}
                          {rondasDelBloque(bloque) === 1 ? "ronda" : "rondas"}
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-2 border-t border-white/[0.07] pt-3">
                        {bloque.exercises.map((item) => (
                          <div key={item.id} className="flex items-start gap-2">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-white/30" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-[11px] text-white/75">
                                  {item.name}
                                </span>
                                <span className="shrink-0 text-[9px] tabular-nums text-white/35">
                                  {item.sets}×{repeticionesObjetivo(item)}
                                  {item.weight > 0 ? ` · ${item.weight} kg` : ""}
                                  {item.restSeconds !== null
                                    ? ` · ${item.restSeconds} s`
                                    : ""}
                                </span>
                              </div>
                              {item.instructions && (
                                <div className="mt-0.5 truncate text-[9px] text-violet-200/40">
                                  <TextWithLinks>{item.instructions}</TextWithLinks>
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HomeAtleta({
  routines,
  rutina,
  onSelect,
  onStart,
  progreso,
  onReset,
}: {
  routines: Routine[];
  rutina: Routine;
  onSelect: (id: string) => void;
  onStart: () => void;
  progreso: number;
  onReset: () => void;
}) {
  const ejerciciosRutinaActiva = cantidadEjercicios(rutina);
  const rutinaIncompleta = !rutinaTieneEjercicios(rutina);

  return (
    <div className={desktopPageShellClassName}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className={pageEyebrowClassName}>Planes asignados</div>
          <h1 className={pageTitleClassName}>Todas tus rutinas</h1>
          <p className={pageDescriptionClassName}>
            Revisá tus planes, detectá cuáles todavía están en preparación y empezá
            solo cuando la rutina ya tenga el contenido cargado.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-6">
        <aside className="xl:sticky xl:top-24">
          <div className="mb-3 hidden items-center justify-between xl:flex">
            <span className="text-xs font-medium text-white/60">
              Tus rutinas
            </span>
            <span className="text-[10px] text-white/25">
              {routines.length} planes
            </span>
          </div>
          <SelectorRutina
            routines={routines}
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
              {rutina.title}
            </h2>
            <p className="mt-2 text-xs text-indigo-100/40">
              <TextWithLinks>{rutina.objective}</TextWithLinks>
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ...(rutina.durationMinutes
                  ? [[Clock3, `${rutina.durationMinutes} min`]]
                  : []),
                [Dumbbell, `${ejerciciosRutinaActiva} ejercicios`],
                [LayoutGrid, `${rutina.blocks.length} bloques`],
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
                disabled={rutinaIncompleta}
                className="h-12 w-full rounded-full bg-indigo-50 text-indigo-950 hover:bg-cyan-100 sm:w-auto sm:px-8"
              >
                {rutinaIncompleta
                  ? "Rutina en preparación"
                  : progreso
                    ? "Continuar rutina"
                    : "Comenzar rutina"}
                <ArrowRight />
              </Button>
              {rutinaIncompleta && (
                <p className="max-w-md text-[11px] leading-relaxed text-amber-100/70 sm:pl-1">
                  Tu entrenador todavía no cargó ejercicios en esta rutina. Podés
                  revisar otra asignación o esperar a que la complete.
                </p>
              )}
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
  routines,
  workouts,
  onStart,
  onUpdate,
  navigate,
}: {
  atleta: User;
  routines: Routine[];
  workouts: ScheduledWorkout[];
  onStart: (item: ScheduledWorkout) => void;
  onUpdate: (item: ScheduledWorkout) => void;
  navigate: (path: string) => void;
}) {
  const hoy = localDate();
  const fechaLegible = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${hoy}T12:00:00`));
  const entrenamientosDeHoy = workouts
    .filter((item) => item.date === hoy && item.status !== "skipped")
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const proximoEntrenamiento = workouts
    .filter(
      (item) =>
        item.date > hoy &&
        item.status !== "skipped" &&
        item.status !== "completed",
    )
    .sort((a, b) =>
      `${a.date}${a.time ?? ""}`.localeCompare(`${b.date}${b.time ?? ""}`),
    )[0];

  return (
    <div className={desktopPageShellClassName}>
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <div className={pageEyebrowClassName}>Tu día</div>
          <h1 className={pageTitleClassName}>Tu entrenamiento de hoy</h1>
          <p className={pageDescriptionClassName}>
            Hola, {atleta.name}. {fechaLegible}
          </p>
        </div>
      </div>

      {entrenamientosDeHoy.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {entrenamientosDeHoy.map((entrenamiento) => {
              const completed = entrenamiento.status === "completed";
              const rutina =
                entrenamiento.origin === "routine"
                  ? routines.find((item) => item.id === entrenamiento.routineId) ?? null
                  : null;
              const rutinaDisponible = rutina ? rutinaTieneEjercicios(rutina) : false;
              const categoryLabel =
                entrenamiento.origin === "external"
                  ? activityCategories.find(
                      (category) => category.value === entrenamiento.category,
                    )?.label ?? "Actividad externa"
                  : null;

              return (
                <Card
                  key={entrenamiento.id}
                  className="relative overflow-hidden border-white/[0.09] bg-[#101116] text-white shadow-[0_24px_70px_rgba(0,0,0,.35)]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,.15),transparent_38%),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.13),transparent_45%)]" />
                  <CardContent className="relative p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-cyan-100/55">
                          {entrenamiento.time && (
                            <>
                              <Clock3 className="size-3" />
                              <span>{entrenamiento.time}</span>
                            </>
                          )}
                          {entrenamiento.origin === "external" && categoryLabel && (
                            <span className="rounded-full border border-violet-200/15 bg-violet-300/10 px-2 py-1 text-[9px] text-violet-100/70">
                              {categoryLabel}
                            </span>
                          )}
                        </div>
                        <h2 className="mt-4 text-2xl font-light tracking-[-0.03em]">
                          {entrenamiento.origin === "routine"
                            ? rutina?.title ?? "Rutina no disponible"
                            : entrenamiento.title}
                        </h2>
                        <p className="mt-2 text-xs leading-relaxed text-white/35">
                          {entrenamiento.origin === "routine" ? (
                            <TextWithLinks>{rutina?.objective ?? "Rutina asignada para hoy."}</TextWithLinks>
                          ) : entrenamiento.notes ? (
                            <TextWithLinks>{entrenamiento.notes}</TextWithLinks>
                          ) : (
                            "Actividad agendada fuera de RTTP para registrar como realizada cuando termines."
                          )}
                        </p>
                      </div>
                      {completed && (
                        <Badge
                          className={cn(
                            "shrink-0 text-[9px]",
                            entrenamiento.origin === "routine"
                              ? "border-emerald-200/10 bg-emerald-300/10 text-emerald-200"
                              : "border-violet-200/10 bg-violet-300/10 text-violet-100",
                          )}
                        >
                          <CheckCircle2 />
                          {entrenamiento.origin === "routine" ? "Completada" : "Realizada"}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {entrenamiento.durationMinutes && (
                        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/25 px-3 py-2 text-[10px] text-white/55">
                          <Clock3 className="size-3 text-cyan-200" />
                          {entrenamiento.durationMinutes} min
                        </div>
                      )}
                      {entrenamiento.origin === "routine" && rutina && (
                        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/25 px-3 py-2 text-[10px] text-white/55">
                          <Dumbbell className="size-3 text-violet-200" />
                          {cantidadEjercicios(rutina)} ejercicios
                        </div>
                      )}
                      {entrenamiento.origin === "routine" &&
                        rutina &&
                        !rutinaDisponible && (
                          <div className="flex items-center gap-2 rounded-full border border-amber-300/12 bg-amber-300/[0.08] px-3 py-2 text-[10px] text-amber-100/75">
                            <Dumbbell className="size-3" />
                            Rutina en preparación
                          </div>
                        )}
                      {entrenamiento.origin === "external" && (
                        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/25 px-3 py-2 text-[10px] text-white/55">
                          <Activity className="size-3 text-violet-200" />
                          Actividad externa
                        </div>
                      )}
                    </div>

                    {!completed && (
                      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                        {entrenamiento.origin === "routine" && rutina && (
                          <OverviewRutina
                            rutina={rutina}
                            className="h-11 w-full justify-center px-5 text-xs sm:w-auto"
                          />
                        )}
                        <Button
                          onClick={() =>
                            entrenamiento.origin === "routine"
                              ? onStart(entrenamiento)
                              : onUpdate({ ...entrenamiento, status: "completed" })
                          }
                          disabled={
                            entrenamiento.origin === "routine" &&
                            rutina !== null &&
                            !rutinaDisponible
                          }
                          className="h-11 w-full rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200 sm:w-auto sm:px-7"
                        >
                          {entrenamiento.origin === "routine"
                            ? !rutinaDisponible
                              ? "Rutina en preparación"
                              : entrenamiento.status === "in-progress"
                                ? "Continuar rutina"
                                : "Comenzar rutina"
                            : "Marcar como realizada"}
                          <ArrowRight />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
                  Inicio rápido
                </div>
                <h2 className="mt-2 text-lg font-medium text-white/90">
                  ¿Salió un entrenamiento no planificado?
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-white/38 md:text-sm">
                  Entrá a tus rutinas y empezá una al instante sin depender de la agenda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/routines")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/[0.1] px-5 text-xs font-medium text-white/75 transition-colors hover:border-cyan-200/30 hover:bg-white/[0.04] hover:text-white"
              >
                Ir a mis rutinas
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-white/[0.09] bg-white/[0.02] px-6 text-center">
            <div>
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-cyan-300/[0.08] text-cyan-100/55">
                <CalendarDays className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-medium">No tenés entrenamientos para hoy</h2>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-white/35">
                Podés descansar, revisar tu semana o programar una rutina desde la agenda.
              </p>
              <button
                type="button"
                onClick={() => navigate("/schedule")}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-cyan-300 px-5 text-xs font-medium text-indigo-950 transition-colors hover:bg-cyan-200"
              >
                Ver agenda
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {proximoEntrenamiento && (
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 text-left md:p-6">
                <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
                  Próximo turno
                </div>
                <h2 className="mt-2 text-lg font-medium text-white/90">
                  {proximoEntrenamiento.origin === "routine"
                    ? routines.find((item) => item.id === proximoEntrenamiento.routineId)?.title ??
                      "Rutina agendada"
                    : proximoEntrenamiento.title}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-white/38 md:text-sm">
                  {new Intl.DateTimeFormat("es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }).format(new Date(`${proximoEntrenamiento.date}T12:00:00`))}
                  {proximoEntrenamiento.time ? ` · ${proximoEntrenamiento.time}` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/schedule")}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.1] px-5 text-xs font-medium text-white/75 transition-colors hover:border-cyan-200/30 hover:bg-white/[0.04] hover:text-white"
                >
                  Ver semana completa
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 text-left md:p-6">
              <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
                Inicio rápido
              </div>
              <h2 className="mt-2 text-lg font-medium text-white/90">¿Estás por entrenar?</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/38 md:text-sm">
                Si te surgió una sesión no planificada, abrí tus rutinas y arrancá en segundos.
              </p>
              <button
                type="button"
                onClick={() => navigate("/routines")}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.1] px-5 text-xs font-medium text-white/75 transition-colors hover:border-cyan-200/30 hover:bg-white/[0.04] hover:text-white"
              >
                Ir a mis rutinas
                <ArrowRight className="size-3.5" />
              </button>
            </div>
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
  rutina: Routine;
  sesionId: string;
  registros: Record<string, TrainingSetRecord>;
  setRegistros: React.Dispatch<
    React.SetStateAction<Record<string, TrainingSetRecord>>
  >;
  indiceActivo: number;
  setIndiceActivo: React.Dispatch<React.SetStateAction<number>>;
  onExit: () => void;
  onFinish: () => void;
}) {
  const pasos = pasosDeRutina(rutina, sesionId);
  const paso = pasos[indiceActivo];
  const bloque = rutina.blocks[paso.bloqueIndex];
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
    bloque.exercises.length > 1 &&
    (["preparation", "specific-preparation", "circuit-2-rounds"].includes(
      bloque.type,
    ) ||
      /entrada|activación|movilidad/i.test(bloque.name));

  const valorInicial: TrainingSetRecord = {
    weight: paso.weight,
    reps: paso.minReps,
    completed: false,
    skipped: false,
  };
  const registro = registros[paso.stepId] ?? valorInicial;

  function actualizar(patch: Partial<TrainingSetRecord>) {
    setRegistros((actuales) => ({
      ...actuales,
      [paso.stepId]: {
        ...(actuales[paso.stepId] ?? valorInicial),
        ...patch,
      },
    }));
  }

  function avanzar() {
    setDragX(0);
    let siguiente = indiceActivo + 1;
    while (
      siguiente < pasos.length &&
      registros[pasos[siguiente].stepId]?.skipped
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
      return item.blockId === paso.blockId;
    });
    const idsOmitidos = new Set(objetivos.map((item) => item.stepId));

    setRegistros((actuales) => {
      const siguientes = { ...actuales };
      objetivos.forEach((item) => {
        const existente = actuales[item.stepId];
        siguientes[item.stepId] = existente
          ? { ...existente, completed: false, skipped: true }
          : {
              weight: item.weight,
              reps: item.minReps,
              completed: false,
              skipped: true,
            };
      });
      return siguientes;
    });

    let siguiente = indiceActivo + 1;
    while (
      siguiente < pasos.length &&
      (idsOmitidos.has(pasos[siguiente].stepId) ||
        registros[pasos[siguiente].stepId]?.skipped)
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
        item.blockId === paso.blockId && item.round === paso.round,
    );
    const ids = new Set(objetivos.map((item) => item.stepId));

    setRegistros((actuales) => {
      const siguientes = { ...actuales };
      objetivos.forEach((item) => {
        siguientes[item.stepId] = {
          weight: actuales[item.stepId]?.weight ?? item.weight,
          reps:
            actuales[item.stepId]?.reps ?? item.minReps,
          completed: true,
          skipped: false,
        };
      });
      return siguientes;
    });

    const ultimoIndice = pasos.reduce(
      (ultimo, item, index) => (ids.has(item.stepId) ? index : ultimo),
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
      if (registro.completed || registro.skipped) {
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
    <div className="mx-auto flex h-dvh max-w-[1760px] flex-col overflow-hidden px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] md:px-8 md:py-5 xl:px-10">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            aria-label="Salir del entrenamiento"
            className="size-9 rounded-full border border-indigo-200/10 text-indigo-100/55 hover:bg-indigo-300/10 hover:text-white"
          >
            <ArrowLeft />
          </Button>
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-[0.18em] text-cyan-200/65">
              Rutina en curso
            </div>
            <div className="mt-1 text-[10px] text-indigo-100/35">
              Bloque {paso.bloqueIndex + 1} de {rutina.blocks.length}
            </div>
          </div>
          <div className="size-9" />
        </div>
        <Progress
          value={(paso.bloqueIndex / rutina.blocks.length) * 100}
          className="h-1 bg-indigo-300/10"
        />
      </div>

      <div className="mx-auto mt-3 min-h-0 w-full max-w-lg flex-1 overflow-y-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:max-w-4xl">
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
              {paso.blockName}
            </Badge>
            <span className="ml-2 text-[9px] text-indigo-100/30">
              Ronda {paso.round}/{paso.rondas}
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
            {bloque.exercises.map((item, index) => (
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
                    {bloque.exercises.length} ejercicios · vuelta {paso.round}{" "}
                    de {paso.rondas}
                  </p>
                </div>
                <div className="grid size-10 shrink-0 place-items-center rounded-full border border-cyan-200/15 bg-cyan-300/10 text-cyan-200">
                  <ListChecks className="size-4" />
                </div>
              </div>

              <div className="mt-5 divide-y divide-white/[0.07] rounded-2xl border border-white/[0.07] bg-black/20 px-4">
                {bloque.exercises.map((item, index) => {
                  const pasoDeRonda = pasos.find(
                    (candidato) =>
                      candidato.blockId === paso.blockId &&
                      candidato.round === paso.round &&
                      candidato.id === item.id,
                  );
                  const completado = pasoDeRonda
                    ? registros[pasoDeRonda.stepId]?.completed
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
                          {item.name}
                        </div>
                        {item.instructions && (
                          <div className="mt-0.5 truncate text-[9px] text-violet-200/40">
                            <TextWithLinks>{item.instructions}</TextWithLinks>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-[10px] tabular-nums text-white/40">
                        {item.sets}×{repeticionesObjetivo(item)}
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
                {paso.round === paso.rondas
                  ? "Completar calentamiento"
                  : `Completar vuelta ${paso.round}`}
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
        <div className="relative">
          {pasos[indiceActivo + 2] && (
            <div className="absolute inset-x-8 bottom-0 top-4 rounded-[2rem] border border-blue-200/[0.06] bg-blue-300/[0.025]" />
          )}
          {proximo && (
            <div className="absolute inset-x-4 bottom-0 top-2 rounded-[2rem] border border-violet-200/[0.09] bg-violet-300/[0.045]" />
          )}
          <div
            role="group"
            aria-label={`${paso.name}, ronda ${paso.round}`}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={() => {
              inicioPointer.current = null;
              setDragging(false);
              setDragX(0);
            }}
            className={cn(
              "relative z-10 select-none overflow-hidden rounded-[2rem] border bg-[#101116] p-4 pb-5 shadow-[0_30px_80px_rgba(0,0,0,.5)] md:p-5",
              registro.completed
                ? "border-cyan-300/30"
                : registro.skipped
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
            <div className="relative flex flex-col">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-indigo-100/30">
                    Serie {paso.round} de {paso.sets}
                  </div>
                  <h1 className="mt-2 text-[2rem] font-light leading-tight tracking-[-0.04em]">
                    {paso.name}
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
                            title: "Saltar esta serie",
                            texto: `Omitir solo la serie ${paso.round} de ${paso.name}.`,
                          },
                          {
                            alcance: "ejercicio" as const,
                            icono: Dumbbell,
                            title: "Saltar ejercicio",
                            texto:
                              "Útil si la máquina está ocupada. Omite sus series restantes.",
                          },
                          {
                            alcance: "bloque" as const,
                            icono: LayoutGrid,
                            title: "Saltar bloque",
                            texto:
                              paso.bloqueIndex === rutina.blocks.length - 1
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
                                {opcion.title}
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
                      registro.completed
                        ? "border-cyan-200/25 bg-cyan-300 text-indigo-950"
                        : registro.skipped
                          ? "border-orange-200/20 bg-orange-300/10 text-orange-200"
                          : "border-indigo-200/10 bg-indigo-300/[0.07] text-indigo-100/30",
                    )}
                  >
                    {registro.completed ? (
                      <Check />
                    ) : registro.skipped ? (
                      <SkipForward />
                    ) : (
                      <Dumbbell />
                    )}
                  </div>
                </div>
              </div>

              {paso.instructions && (
                <div className="mt-3 flex w-full flex-col rounded-xl border border-violet-300/15 bg-violet-300/[0.07] px-3 py-2">
                  <span className="text-[8px] uppercase tracking-[0.14em] text-violet-200/45">
                    Aclaraciones
                  </span>
                  <span className="mt-1 text-[11px] leading-relaxed text-violet-100/70">
                    <TextWithLinks>{paso.instructions}</TextWithLinks>
                  </span>
                </div>
              )}

              {paso.restSeconds !== null && (
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
                    {paso.restSeconds}
                    <span className="ml-1 text-[10px] text-blue-100/40">s</span>
                  </div>
                </div>
              )}

              <Separator className="my-3 bg-indigo-200/[0.08]" />

              <div className="grid grid-cols-2 gap-3">
                <CampoPrescripcion
                  label="Repeticiones"
                  hint={`Objetivo ${repeticionesObjetivo(paso)}`}
                  value={registro.reps}
                  onChange={(reps) => actualizar({ reps })}
                />
                <CampoPrescripcion
                  label="Peso"
                  hint="Kilogramos"
                  step={0.5}
                  value={registro.weight}
                  onChange={(weight) => actualizar({ weight })}
                />
              </div>

              <Button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  actualizar({
                    completed: !registro.completed,
                    skipped: false,
                  });
                }}
                className={cn(
                  "mt-5 h-12 w-full rounded-full",
                  registro.completed
                    ? "border border-cyan-200/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"
                    : "bg-indigo-50 text-indigo-950 hover:bg-cyan-100",
                )}
              >
                {registro.completed ? (
                  <>
                    <RotateCcw />
                    Serie completada
                  </>
                ) : (
                  <>
                    <Check />
                    {registro.skipped
                      ? "Registrar esta serie"
                      : "Completar serie"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-2 text-center">
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
            disabled={!registro.completed && !registro.skipped}
            onClick={avanzar}
            className="h-11 flex-[1.5] rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200 disabled:bg-indigo-300/10 disabled:text-indigo-100/25"
          >
            {indiceActivo === pasos.length - 1 ? "Finalizar" : "Siguiente"}
            <ArrowRight />
          </Button>
        </div>

        <div className="mt-2 flex items-start gap-3 rounded-2xl border border-indigo-200/[0.08] bg-indigo-300/[0.04] px-4 py-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan-300/[0.08] text-cyan-100/55">
            <ArrowRight className="size-3.5" />
          </div>
          <div className="min-w-0 pt-0.5">
            <div className="text-[8px] uppercase tracking-[0.16em] text-indigo-100/30">
              Siguiente ejercicio
            </div>
            <div className="mt-1 text-xs leading-snug text-indigo-50/70">
              {proximo?.name ?? "Finalizar rutina"}
            </div>
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
  atleta: User;
  feedback: string;
  setFeedback: (value: string) => void;
  onDone: (effort: number) => void;
}) {
  const [effort, setEsfuerzo] = useState(4);
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-5xl place-items-center px-4 py-8 md:px-8 xl:px-10">
      <Card className="w-full border-violet-200/[0.12] bg-[#101116] text-center text-white shadow-[0_30px_90px_rgba(0,0,0,.5)]">
        <CardContent className="p-6 md:p-9 xl:grid xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] xl:items-center xl:gap-10 xl:p-12">
          <div>
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-400 text-indigo-950">
            <Trophy className="size-6" />
          </div>
          <h1 className="mt-5 text-3xl font-light">          Rutina completada</h1>
          <p className="mt-2 text-xs text-indigo-100/40">
            Excelente trabajo, {atleta.name}.
          </p>
          <div className="my-6 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setEsfuerzo(value)}
                aria-label={`Esfuerzo ${value} de 5`}
                className={cn(
                  "grid size-10 place-items-center rounded-full border",
                  value <= effort
                    ? "border-orange-200/20 bg-orange-300/10 text-orange-300"
                    : "border-indigo-200/10 text-indigo-100/15",
                )}
              >
                <Flame
                  className={cn("size-4", value <= effort && "fill-current")}
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
            onClick={() => onDone(effort)}
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
  routines,
  rutina,
  entrenamientoInicial,
  onSelect,
  onCreateEntrenamiento,
  onUpdateEntrenamiento,
  onCompleteRoutine,
  onCloseScheduled,
  onWorkoutModeChange,
  registros,
  setRegistros,
}: {
  atleta: User;
  routines: Routine[];
  rutina: Routine;
  entrenamientoInicial?: ScheduledWorkout;
  onSelect: (id: string) => void;
  onCreateEntrenamiento: (
    item: NewScheduledWorkout,
  ) => ScheduledWorkout;
  onUpdateEntrenamiento: (item: ScheduledWorkout) => void;
  onCompleteRoutine: (data: {
    entrenamiento: ScheduledWorkout;
    rutina: Routine;
    sets: ActivitySet[];
    effort: number;
    feedback: string;
  }) => void;
  onCloseScheduled: () => void;
  onWorkoutModeChange: (active: boolean) => void;
  registros: Record<string, TrainingSetRecord>;
  setRegistros: React.Dispatch<
    React.SetStateAction<Record<string, TrainingSetRecord>>
  >;
}) {
  const [pantalla, setPantalla] = useState<"home" | "workout" | "final">(
    entrenamientoInicial ? "workout" : "home",
  );
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [entrenamiento, setEntrenamiento] = useState<
    ScheduledWorkout | undefined
  >(entrenamientoInicial);
  const sesionId = entrenamiento?.id;
  const progreso = Object.entries(registros).filter(
    ([key, value]) => sesionId && key.startsWith(`${sesionId}-`) && value.completed,
  ).length;

  useEffect(() => {
    onWorkoutModeChange(pantalla === "workout");
    return () => onWorkoutModeChange(false);
  }, [onWorkoutModeChange, pantalla]);

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
      const enCurso = { ...entrenamiento, status: "in-progress" as const };
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
        onDone={(effort) => {
          if (entrenamiento) {
            const completado = {
              ...entrenamiento,
              status: "completed" as const,
            };
            const sets = pasosDeRutina(rutina, entrenamiento.id).flatMap(
              (paso): ActivitySet[] => {
                const registro = registros[paso.stepId];
                if (!registro || (!registro.completed && !registro.skipped)) {
                  return [];
                }
                return [
                  {
                    stepId: paso.stepId,
                    exerciseId: paso.id,
                    exerciseName: paso.name,
                    blockId: paso.blockId,
                    blockName: paso.blockName,
                    round: paso.round,
                    weight: registro.weight,
                    reps: registro.reps,
                    skipped: registro.skipped,
                  },
                ];
              },
            );
            setEntrenamiento(completado);
            onUpdateEntrenamiento(completado);
            onCompleteRoutine({
              entrenamiento: completado,
              rutina,
              sets,
              effort,
              feedback: feedback.trim(),
            });
          }
          cerrarEntrenamiento();
        }}
      />
    );
  }

  return (
    <HomeAtleta
      routines={routines}
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
  const [pathname, setPathname] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/",
  );
  const [users, setUsuarios] = useState<User[]>(initialUsers);
  const [routines, setRutinas] = useState<Routine[]>(initialRoutines);
  const [templates, setPlantillas] = useState<RoutineTemplate[]>([]);
  const [workouts, setEntrenamientos] = useState<
    ScheduledWorkout[]
  >([]);
  const [activities, setActividades] = useState<CompletedActivity[]>([]);
  const [entrenamientoActivoId, setEntrenamientoActivoId] = useState<
    string | null
  >(null);
  const [routineId, setRutinaId] = useState(initialRoutines[0].id);
  const [userId, setUserId] = useState<number | null>(null);
  const [atletaSeleccionadoId, setAtletaSeleccionadoId] = useState(1);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);
  const [workoutImmersive, setWorkoutImmersive] = useState(false);
  const [registros, setRegistros] = useState<
    Record<string, TrainingSetRecord>
  >({});
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const persistenceQueueRef = useRef<Promise<void>>(Promise.resolve());
  const remoteDataAppliedRef = useRef(false);
  const usuario =
    users.find((item) => item.id === userId) ?? null;
  const atletasDelCoach = users.filter(
    (item) =>
      item.role === "athlete" && usuario?.athleteIds?.includes(item.id),
  );
  const atleta =
    usuario?.role === "athlete"
      ? usuario
      : atletasDelCoach.find((item) => item.id === atletaSeleccionadoId) ??
        atletasDelCoach[0];
  const rutinasDelAtleta = atleta
    ? routines.filter((item) => item.athleteId === atleta.id)
    : [];
  const rutina =
    rutinasDelAtleta.find((item) => item.id === routineId) ??
    rutinasDelAtleta[0];
  const entrenamientoActivo = workouts.find(
    (item) => item.id === entrenamientoActivoId,
  );
  const rutinaDeEntrenamiento =
    entrenamientoActivo?.origin === "routine"
      ? rutinasDelAtleta.find(
          (item) => item.id === entrenamientoActivo.routineId,
        ) ?? rutina
      : rutina;
  const atletaRutaId = Number(pathname.split("/").at(-1));
  const detalleAtleta =
    pathname.startsWith("/coach/athletes/") &&
    Number.isInteger(atletaRutaId);
  const vistaEntrenador: CoachView =
    pathname.startsWith("/coach/athletes")
      ? "atletas"
      : pathname === "/coach/routines"
        ? "routines"
        : "resumen";
  const vistaAtleta: AthleteView =
    pathname === "/schedule"
      ? "agenda"
      : pathname === "/activities"
        ? "activities"
      : pathname === "/routines"
        ? "routines"
        : "inicio";

  function navigate(path: string) {
    window.history.pushState(null, "", path);
    setPathname(path);
  }

  useEffect(() => {
    function onPopState() {
      setPathname(window.location.pathname);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      void hydrate();
    });
    const retryPending = () => {
      void hydrate();
    };
    window.addEventListener("online", retryPending);

    async function hydrate() {
      clearDeprecatedLocalStorage();
      let remoteDataApplied = false;
      const availableUsers = initialUsers.map(normalizeUser);
      const availableRoutines = initialRoutines;
      const availableTemplates: RoutineTemplate[] = [];
      const availableWorkouts: ScheduledWorkout[] = [];
      const availableActivities: CompletedActivity[] = [];
      const persistedUsers: User[] = [];
      const persistedRoutines: Routine[] = [];
      const persistedTemplates: RoutineTemplate[] = [];
      const persistedWorkouts: ScheduledWorkout[] = [];
      const persistedActivities: CompletedActivity[] = [];
      const localData = {
        users: availableUsers,
        routines: availableRoutines,
        templates: availableTemplates,
        workouts: availableWorkouts,
        activities: availableActivities,
      };
      const persistedLocalData = {
        users: persistedUsers,
        routines: persistedRoutines,
        templates: persistedTemplates,
        workouts: persistedWorkouts,
        activities: persistedActivities,
      };

      let finalData = localData;
      try {
        if (!supabaseConfigured) {
          throw new Error(
            "Supabase no está configurado. Los cambios solo vivirán mientras esta pestaña siga abierta.",
          );
        }
        await navigator.locks.request(supabaseMigrationLock, async () => {
          const migrationStatus = readSessionValue(supabaseMigrationStorageKey);
          if (migrationStatus === "true") {
            removeSessionValue(supabaseMigrationSourceStorageKey);
            return;
          }

          let origin = readMigrationSource();
          if (!origin) {
            origin = {
              persistedData: persistedLocalData,
              dataWithSeeds: localData,
              useSeeds:
                migrationStatus === "seeds"
                  ? true
                  : migrationStatus === "local"
                    ? false
                    : null,
              mutations: [],
              userId: null,
              athleteId: null,
              remappingStarted: false,
            };
            saveMigrationSource(origin);
          }

          const currentRemoteData = await loadSupabaseData();
          if (origin.useSeeds === null) {
            origin = {
              ...origin,
              useSeeds: Object.values(currentRemoteData).every(
                (items) => items.length === 0,
              ),
            };
            saveMigrationSource(origin);
            writeSessionValue(
              supabaseMigrationStorageKey,
              origin.useSeeds ? "seeds" : "local",
            );
          }

          const userMapping = await migrateMissingData(
            origin.useSeeds
              ? origin.dataWithSeeds
              : origin.persistedData,
          );
          writeSessionValue(
            supabaseUserMappingStorageKey,
            JSON.stringify(userMapping),
          );
          if (!origin.remappingStarted) {
            origin = {
              ...origin,
              mutations: readPendingMutations(),
              userId: readSessionValue(sessionStorageKey),
              athleteId: readSessionValue(selectedAthleteStorageKey),
              remappingStarted: true,
            };
            saveMigrationSource(origin);
          }
          await navigator.locks.request(supabaseOutboxLock, () => {
            savePendingMutations(
              origin.mutations.map((mutation) =>
                remapSupabaseMutation(mutation, userMapping),
              ),
            );
          });

          for (const [key, storedId] of [
            [sessionStorageKey, origin.userId],
            [selectedAthleteStorageKey, origin.athleteId],
          ] as const) {
            const remappedId = storedId
              ? userMapping[storedId]
              : undefined;
            if (remappedId !== undefined) {
              writeSessionValue(key, String(remappedId));
            }
          }
          writeSessionValue(supabaseMigrationStorageKey, "true");
          removeSessionValue(supabaseMigrationSourceStorageKey);
        });
        await executePendingMutations();
        const remoteData = await loadSupabaseData();
        finalData = {
          ...remoteData,
          users: remoteData.users.map(normalizeUser),
        };
        remoteDataApplied = true;
        if (!cancelled) setSyncError(null);
      } catch (error) {
        if (!cancelled) setSyncError(errorMessage(error));
      }

      if (cancelled) return;
      setUsuarios(finalData.users.map(normalizeUser));
      setRutinas(finalData.routines);
      setPlantillas(finalData.templates);
      setEntrenamientos(finalData.workouts);
      setActividades(finalData.activities);
      remoteDataAppliedRef.current = remoteDataApplied;

      const storedUserId = Number(readSessionValue(sessionStorageKey));
      if (finalData.users.some((item) => item.id === storedUserId)) {
        setUserId(storedUserId);
        const initialUser = finalData.users.find(
          (item) => item.id === storedUserId,
        );
        const storedAthleteId = Number(readSessionValue(selectedAthleteStorageKey));
        setAtletaSeleccionadoId(
          initialUser?.role === "athlete"
            ? initialUser.id
            : initialUser?.athleteIds?.includes(atletaRutaId)
              ? atletaRutaId
              : initialUser?.athleteIds?.includes(storedAthleteId)
                ? storedAthleteId
                : initialUser?.athleteIds?.[0] ?? 1,
        );
      }
      setHydrated(true);
    }

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("online", retryPending);
    };
  }, [atletaRutaId]);

  function persist(newMutation: NewSupabaseMutation) {
    const mutation: SupabaseMutation = {
      ...newMutation,
      id: crypto.randomUUID(),
    };
    const requiresRemapping = !remoteDataAppliedRef.current;
    const operation = persistenceQueueRef.current.then(async () => {
      await enqueueMutation(mutation, requiresRemapping);
      await executePendingMutations();
    });
    persistenceQueueRef.current = operation.catch(() => undefined);
    void operation
      .then(() => setSyncError(null))
      .catch((error: unknown) => setSyncError(errorMessage(error)));
  }

  function guardarRutina(rutinaGuardada: Routine) {
    setRutinas((actuales) =>
      actuales.map((item) =>
        item.id === rutinaGuardada.id ? rutinaGuardada : item,
      ),
    );
    persist({ type: "save-routines", data: [rutinaGuardada] });
  }

  function acceder(email: string) {
    const usuarioEncontrado = users.find(
      (item) => item.email === email.trim().toLowerCase(),
    );
    if (!usuarioEncontrado) return false;

    const athleteId =
      usuarioEncontrado.role === "athlete"
        ? usuarioEncontrado.id
        : usuarioEncontrado.athleteIds?.[0] ?? 1;
    const primeraRutina = routines.find((item) => item.athleteId === athleteId);
    setUserId(usuarioEncontrado.id);
    setAtletaSeleccionadoId(athleteId);
    setRutinaId(primeraRutina?.id ?? initialRoutines[0].id);
    setVistaPrevia(false);
    writeSessionValue(sessionStorageKey, String(usuarioEncontrado.id));
    return true;
  }

  function seleccionarAtleta(id: number) {
    const primeraRutina = routines.find((item) => item.athleteId === id);
    setAtletaSeleccionadoId(id);
    writeSessionValue(selectedAthleteStorageKey, String(id));
    if (primeraRutina) setRutinaId(primeraRutina.id);
    setRegistros({});
  }

  function crearRutina(rutinaNueva: Routine) {
    setRutinas((actuales) => [...actuales, rutinaNueva]);
    setRutinaId(rutinaNueva.id);
    persist({ type: "save-routines", data: [rutinaNueva] });
  }

  function crearEntrenamiento(
    item: NewScheduledWorkout,
  ): ScheduledWorkout {
    const ahora = new Date().toISOString();
    const creado: ScheduledWorkout = {
      ...item,
      id: createWorkoutId(),
      createdAt: ahora,
      updatedAt: ahora,
    };
    setEntrenamientos((actuales) => [...actuales, creado]);
    persist({ type: "save-workouts", data: [creado] });
    return creado;
  }

  function actualizarEntrenamiento(item: ScheduledWorkout) {
    const actualizado = {
      ...item,
      updatedAt: new Date().toISOString(),
    };
    setEntrenamientos((actuales) =>
      actuales.map((actual) =>
        actual.id === item.id ? actualizado : actual,
      ),
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
        effort: null,
        feedback: "",
        notes: item.notes,
        sets: [],
        recordedById: usuario?.id ?? item.athleteId,
      };
      setActividades((actuales) =>
        actuales.some(
          (actual) =>
            actual.scheduledWorkoutId === item.id,
        )
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
    effort,
    feedback,
  }: {
    entrenamiento: ScheduledWorkout;
    rutina: Routine;
    sets: ActivitySet[];
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
      routineSnapshot: snapshotRoutine(rutinaCompletada),
      date: entrenamiento.date,
      completedAt: new Date().toISOString(),
      durationMinutes: entrenamiento.durationMinutes,
      effort,
      feedback,
      notes: entrenamiento.notes,
      sets,
      recordedById: usuario?.id ?? entrenamiento.athleteId,
    };
    setActividades((actuales) =>
      actuales.some(
        (actual) =>
          actual.scheduledWorkoutId === entrenamiento.id,
      )
        ? actuales
        : [...actuales, actividad],
    );
    persist({ type: "save-activity", data: actividad });
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
    persist({ type: "delete-workout", entityId: id });
  }

  function eliminarActividad(actividad: CompletedActivity) {
    if (
      !window.confirm(
        actividad.type === "external"
          ? `¿Querés eliminar "${actividad.title}" del historial?\n\nTambién la vamos a quitar de la agenda para que no quede como actividad completada.`
          : `¿Querés eliminar "${actividad.title}" del historial?`,
      )
    ) {
      return;
    }

    setActividades((actuales) =>
      actuales.filter((item) => item.id !== actividad.id),
    );
    persist({ type: "delete-activity", entityId: actividad.id });

    if (actividad.type !== "external") return;

    setEntrenamientos((actuales) =>
      actuales.filter((item) => item.id !== actividad.scheduledWorkoutId),
    );
    setRegistros((actuales) =>
      Object.fromEntries(
        Object.entries(actuales).filter(
          ([key]) => !key.startsWith(`${actividad.scheduledWorkoutId}-`),
        ),
      ),
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
    if (!rutinaSeleccionada || !rutinaTieneEjercicios(rutinaSeleccionada)) return;
    setRutinaId(item.routineId);
    actualizarEntrenamiento({ ...item, status: "in-progress" });
    setEntrenamientoActivoId(item.id);
  }

  function guardarComoPlantilla(rutina: Routine) {
    if (!usuario || usuario.role !== "coach") return;
    const id = idPlantilla(usuario.id);
    const plantilla = {
      ...rutina,
      id,
      coachId: usuario.id,
    };
    setPlantillas((actuales) => [...actuales, plantilla]);
    persist({ type: "save-templates", data: [plantilla] });
  }

  function asignarPlantilla(plantillaId: string, athleteId: number) {
    const plantilla = templates.find(
      (item) => item.id === plantillaId && item.coachId === usuario?.id,
    );
    if (!plantilla) return;
    const rutinaNueva = rutinaDesdePlantilla(plantilla, athleteId);
    setRutinas((actuales) => [...actuales, rutinaNueva]);
    persist({ type: "save-routines", data: [rutinaNueva] });
    seleccionarAtleta(athleteId);
    setRutinaId(rutinaNueva.id);
    setRegistros({});
  }

  function eliminarPlantilla(plantillaId: string) {
    setPlantillas((actuales) =>
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
    const rutinaBase: Omit<Routine, "athleteId"> = {
      id: `rutina-${crypto.randomUUID()}`,
      title: "Nueva rutina",
      objective: "Entrenamiento personalizado",
      durationMinutes: null,
      blocks: [
        {
          id: `bloque-${crypto.randomUUID()}`,
          name: "Bloque 1",
          type: "custom",
          exercises: [],
        },
      ],
    };

    let id: number;
    try {
      id = await createAthleteWithRoutine({
        coachId: usuario.id,
        name,
        email,
        routine: rutinaBase,
      });
    } catch (error) {
      const mensaje = errorMessage(error);
      setSyncError(mensaje);
      return mensaje;
    }

    const nuevoAtleta: User = { id, name, email, role: "athlete" };
    const rutinaInicial: Routine = { ...rutinaBase, athleteId: id };
    setUsuarios((actuales) => [
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
    setRutinas((actuales) => [...actuales, rutinaInicial]);
    setAtletaSeleccionadoId(id);
    setRutinaId(rutinaInicial.id);
    setRegistros({});
    setSyncError(null);
    return null;
  }

  function eliminarRutina(id: string) {
    const restantes = rutinasDelAtleta.filter((item) => item.id !== id);
    if (restantes.length === 0) return;
    const idsDeEntrenamientos = workouts
      .filter((item) => item.origin === "routine" && item.routineId === id)
      .map((item) => item.id);
    setRutinas((actuales) => actuales.filter((item) => item.id !== id));
    setEntrenamientos((actuales) =>
      actuales.filter(
        (item) => item.origin !== "routine" || item.routineId !== id,
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
    persist({ type: "delete-routine", entityId: id });
  }

  function salir() {
    removeSessionValue(sessionStorageKey);
    removeSessionValue(selectedAthleteStorageKey);
    setUserId(null);
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

  if (!hydrated) {
    return <div className="min-h-screen bg-[#07080b]" />;
  }

  if (!usuario) {
    return <LandingAcceso onAccess={acceder} />;
  }

  if (!atleta || !rutina) {
    return <LandingAcceso onAccess={acceder} />;
  }

  const mostrandoAtleta = usuario.role === "athlete" || vistaPrevia;

  return (
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
      {!mostrandoAtleta ? (
        <HomeEntrenador
          key={`${atleta.id}-${rutina.id}`}
          entrenador={usuario}
          users={users}
          atletas={atletasDelCoach}
          atleta={atleta}
          routines={rutinasDelAtleta}
          rutinasPorAtleta={routines.filter((item) =>
            atletasDelCoach.some((atletaActual) => atletaActual.id === item.athleteId),
          )}
          workouts={workouts.filter(
            (item) => item.athleteId === atleta.id,
          )}
          activities={activities.filter(
            (item) => item.athleteId === atleta.id,
          )}
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
          onCreateEntrenamiento={crearEntrenamiento}
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
          workouts={workouts.filter(
            (item) => item.athleteId === atleta.id,
          )}
          modoCoach={usuario.role === "coach"}
          onCreate={crearEntrenamiento}
          onUpdate={actualizarEntrenamiento}
          onDelete={eliminarEntrenamiento}
          onStart={comenzarEntrenamiento}
        />
      ) : vistaAtleta === "activities" && !entrenamientoActivo ? (
        <ActivityHistory
          activities={activities.filter(
            (item) => item.athleteId === atleta.id,
          )}
          onDeleteActivity={eliminarActividad}
          canDeleteExternalActivities={usuario.role !== "coach"}
        />
      ) : vistaAtleta === "inicio" && !entrenamientoActivo ? (
        <HomeHoy
          atleta={atleta}
          routines={rutinasDelAtleta}
          workouts={workouts.filter(
            (item) => item.athleteId === atleta.id,
          )}
          onStart={comenzarEntrenamiento}
          onUpdate={actualizarEntrenamiento}
          navigate={navigate}
        />
      ) : (
        <ExperienciaAtleta
          key={`${rutinaDeEntrenamiento.id}-${entrenamientoActivo?.id ?? "routines"}`}
          atleta={atleta}
          routines={rutinasDelAtleta}
          rutina={rutinaDeEntrenamiento}
          entrenamientoInicial={entrenamientoActivo}
          onSelect={setRutinaId}
          onCreateEntrenamiento={crearEntrenamiento}
          onUpdateEntrenamiento={actualizarEntrenamiento}
          onCompleteRoutine={registrarActividadRutina}
          onCloseScheduled={() => setEntrenamientoActivoId(null)}
          onWorkoutModeChange={setWorkoutImmersive}
          registros={registros}
          setRegistros={setRegistros}
        />
      )}
    </AppShell>
  );
}
