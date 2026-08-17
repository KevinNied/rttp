"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Pencil,
  Plus,
  SkipForward,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  activityCategories,
  ActivityCategory,
  ScheduledWorkout,
  localDate,
  startOfWeek,
  NewScheduledWorkout,
  addDays,
} from "@/lib/rttp-agenda";
import { Routine, User } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function etiquetaFecha(date: string, formato: "corta" | "larga" = "corta") {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: formato === "larga" ? "long" : "short",
  }).format(new Date(`${date}T12:00:00`));
}

function tituloEntrenamiento(
  item: ScheduledWorkout,
  routines: Routine[],
) {
  if (item.origin === "external") return item.title;
  return (
    routines.find((rutina) => rutina.id === item.routineId)?.title ??
    "Rutina no disponible"
  );
}

function DialogoEntrenamiento({
  trigger,
  routines,
  atleta,
  usuarioActual,
  fechaInicial,
  rutinaInicialId,
  item,
  onCreate,
  onUpdate,
}: {
  trigger: React.ReactElement;
  routines: Routine[];
  atleta: User;
  usuarioActual: User;
  fechaInicial: string;
  rutinaInicialId?: string;
  item?: ScheduledWorkout;
  onCreate: (item: NewScheduledWorkout) => void;
  onUpdate: (item: ScheduledWorkout) => void;
}) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigen] = useState<"routine" | "external">(
    item?.origin ?? "routine",
  );
  const [routineId, setRutinaId] = useState(
    item?.origin === "routine"
      ? item.routineId
      : rutinaInicialId ?? routines[0]?.id ?? "",
  );
  const [title, setTitulo] = useState(
    item?.origin === "external" ? item.title : "",
  );
  const [category, setCategoria] = useState<ActivityCategory>(
    item?.origin === "external" ? item.category : "running",
  );
  const [date, setFecha] = useState(item?.date ?? fechaInicial);
  const [time, setHora] = useState(item?.time ?? "");
  const [durationMinutes, setDuracion] = useState(
    String(
      item?.durationMinutes ??
        routines.find((rutina) => rutina.id === rutinaInicialId)?.durationMinutes ??
        routines[0]?.durationMinutes ??
        60,
    ),
  );
  const [notes, setNotas] = useState(item?.notes ?? "");

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (!siguiente) return;
    setOrigen(item?.origin ?? "routine");
    setRutinaId(
      item?.origin === "routine"
        ? item.routineId
        : rutinaInicialId ?? routines[0]?.id ?? "",
    );
    setTitulo(item?.origin === "external" ? item.title : "");
    setCategoria(item?.origin === "external" ? item.category : "running");
    setFecha(item?.date ?? fechaInicial);
    setHora(item?.time ?? "");
    setDuracion(
      String(
        item?.durationMinutes ??
          routines.find((rutina) => rutina.id === rutinaInicialId)?.durationMinutes ??
          routines[0]?.durationMinutes ??
          60,
      ),
    );
    setNotas(item?.notes ?? "");
  }

  function guardar() {
    const base = {
      athleteId: atleta.id,
      date,
      time: time || null,
      durationMinutes: Math.max(1, Number(durationMinutes) || 60),
      status: item?.status ?? ("scheduled" as const),
      createdById: item?.createdById ?? usuarioActual.id,
      notes: notes.trim(),
    };
    const siguiente: NewScheduledWorkout =
      origin === "routine"
        ? {
            ...base,
            origin: "routine",
            routineId,
            title: null,
            category: null,
          }
        : {
            ...base,
            origin: "external",
            routineId: null,
            title: title.trim(),
            category,
          };

    if (item) {
      onUpdate({
        ...siguiente,
        id: item.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    } else {
      onCreate(siguiente);
    }
    setOpen(false);
  }

  const valido =
    Boolean(date) &&
    (origin === "routine" ? Boolean(routineId) : Boolean(title.trim()));

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger render={trigger} />
      <DialogContent className="border-white/10 bg-[#111217] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar entrenamiento" : "Programar entrenamiento"}
          </DialogTitle>
          <DialogDescription className="text-white/40">
            Sumá una rutina de RTTP o una actividad que realizás fuera de la app.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/25 p-1">
            {[
              ["routine", "Rutina RTTP"],
              ["external", "Actividad externa"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setOrigen(value as "routine" | "external")}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-xs transition-colors",
                  origin === value
                    ? "bg-cyan-300 text-indigo-950"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {origin === "routine" ? (
            <label className="block space-y-2">
              <span className="text-xs text-white/55">Rutina</span>
              <select
                value={routineId}
                onChange={(event) => {
                  const id = event.target.value;
                  setRutinaId(id);
                  const rutina = routines.find((actual) => actual.id === id);
                  if (rutina) setDuracion(String(rutina.durationMinutes));
                }}
                className="h-10 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none focus:border-cyan-300/40"
              >
                {routines.map((rutina) => (
                  <option key={rutina.id} value={rutina.id}>
                    {rutina.title}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs text-white/55">Actividad</span>
                <Input
                  value={title}
                  onChange={(event) => setTitulo(event.target.value)}
                  placeholder="Ej. Fondo suave"
                  className="border-white/10 bg-black/35"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs text-white/55">Categoría</span>
                <select
                  value={category}
                  onChange={(event) =>
                    setCategoria(event.target.value as ActivityCategory)
                  }
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none focus:border-cyan-300/40"
                >
                  {activityCategories.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="grid grid-cols-[1fr_110px] gap-3">
            <label className="space-y-2">
              <span className="text-xs text-white/55">Fecha</span>
              <Input
                type="date"
                value={date}
                onChange={(event) => setFecha(event.target.value)}
                className="border-white/10 bg-black/35"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs text-white/55">Hora (opcional)</span>
              <Input
                type="time"
                value={time}
                onChange={(event) => setHora(event.target.value)}
                className="border-white/10 bg-black/35"
              />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-xs text-white/55">
              Duración estimada (minutos)
            </span>
            <Input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(event) => setDuracion(event.target.value)}
              className="border-white/10 bg-black/35"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Notas (opcional)</span>
            <Textarea
              value={notes}
              onChange={(event) => setNotas(event.target.value)}
              placeholder="Objetivo, lugar o cualquier detalle útil"
              className="min-h-20 border-white/10 bg-black/35"
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
            disabled={!valido}
            onClick={guardar}
            className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
          >
            {item ? "Guardar cambios" : "Programar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TarjetaEntrenamiento({
  item,
  routines,
  atleta,
  usuarioActual,
  modoCoach,
  onUpdate,
  onDelete,
  onStart,
}: {
  item: ScheduledWorkout;
  routines: Routine[];
  atleta: User;
  usuarioActual: User;
  modoCoach: boolean;
  onUpdate: (item: ScheduledWorkout) => void;
  onDelete: (id: string) => void;
  onStart: (item: ScheduledWorkout) => void;
}) {
  const completado = item.status === "completed";
  const omitido = item.status === "skipped";
  const editable = !completado && !omitido;

  return (
    <div
      draggable={editable}
      onDragStart={(event) =>
        event.dataTransfer.setData("text/plain", item.id)
      }
      className={cn(
        "group rounded-2xl border p-3 transition-colors",
        item.origin === "routine"
          ? "border-cyan-200/15 bg-cyan-300/[0.06]"
          : "border-violet-200/15 bg-violet-300/[0.06]",
        editable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="line-clamp-2 text-xs font-medium leading-snug text-white/90">
            {tituloEntrenamiento(item, routines)}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-white/35">
            {item.time && <span>{item.time}</span>}
            {item.time && <span>·</span>}
            <Clock3 className="size-2.5 shrink-0" />
            <span>{item.durationMinutes} min</span>
          </div>
        </div>
        {completado ? (
          <span
            title="Completado"
            className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-300/10 text-emerald-300"
          >
            <CheckCircle2 className="size-3.5" />
          </span>
        ) : omitido ? (
          <span
            title="Omitido"
            className="grid size-6 shrink-0 place-items-center rounded-full bg-orange-300/10 text-orange-200/70"
          >
            <SkipForward className="size-3.5" />
          </span>
        ) : item.status === "in-progress" ? (
          <Badge className="shrink-0 border-cyan-200/10 bg-cyan-300/10 px-2 text-[8px] text-cyan-100">
            En curso
          </Badge>
        ) : null}
      </div>
      {item.notes && (
        <p className="mt-2 line-clamp-2 text-[9px] leading-relaxed text-white/30">
          {item.notes}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1">
        {editable && (
          <>
            {!modoCoach && item.origin === "routine" && (
              <Button
                size="sm"
                onClick={() => onStart(item)}
                className="h-8 min-w-0 flex-1 rounded-full bg-cyan-300 px-2 text-[10px] text-indigo-950 hover:bg-cyan-200 sm:flex-none sm:px-3 lg:w-full lg:flex-none"
              >
                {item.status === "in-progress" ? "Continuar" : "Comenzar"}
                <ArrowRight />
              </Button>
            )}
            {item.origin === "external" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onUpdate({ ...item, status: "completed" })}
                className="h-8 min-w-0 flex-1 rounded-full px-2 text-[10px] text-emerald-200 hover:bg-emerald-300/10 hover:text-emerald-100 lg:w-full lg:flex-none"
              >
                Realizada
              </Button>
            )}
            <DialogoEntrenamiento
              trigger={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Editar entrenamiento"
                  className="rounded-full text-white/35 hover:bg-white/[0.06] hover:text-white"
                >
                  <Pencil />
                </Button>
              }
              item={item}
              routines={routines}
              atleta={atleta}
              usuarioActual={usuarioActual}
              fechaInicial={item.date}
              onCreate={() => undefined}
              onUpdate={onUpdate}
            />
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Omitir entrenamiento"
              onClick={() => onUpdate({ ...item, status: "skipped" })}
              className="rounded-full text-white/30 hover:bg-orange-300/10 hover:text-orange-200"
            >
              <SkipForward />
            </Button>
          </>
        )}
        <Dialog>
          <DialogTrigger
            render={
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Eliminar entrenamiento"
                className="rounded-full text-white/30 hover:bg-red-300/10 hover:text-red-200"
              />
            }
          >
            <Trash2 />
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-[#111217] text-white">
            <DialogHeader>
              <DialogTitle>¿Eliminar este entrenamiento?</DialogTitle>
              <DialogDescription className="text-white/40">
                Se quitará de la agenda de {atleta.name}. Esta acción no
                elimina la rutina asociada.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose
                render={<Button variant="ghost" className="text-white/45" />}
              >
                Cancelar
              </DialogClose>
              <DialogClose
                render={
                  <Button
                    variant="destructive"
                    onClick={() => onDelete(item.id)}
                    className="bg-red-500 text-white hover:bg-red-400"
                  />
                }
              >
                Eliminar
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function SportsSchedule({
  atleta,
  usuarioActual,
  routines,
  workouts,
  modoCoach = false,
  embedded = false,
  onCreate,
  onUpdate,
  onDelete,
  onStart,
}: {
  atleta: User;
  usuarioActual: User;
  routines: Routine[];
  workouts: ScheduledWorkout[];
  modoCoach?: boolean;
  embedded?: boolean;
  onCreate: (item: NewScheduledWorkout) => void;
  onUpdate: (item: ScheduledWorkout) => void;
  onDelete: (id: string) => void;
  onStart: (item: ScheduledWorkout) => void;
}) {
  const hoy = localDate();
  const [semana, setSemana] = useState(startOfWeek(hoy));
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const dias = Array.from({ length: 7 }, (_, index) => addDays(semana, index));
  const entrenamientosDeSemana = workouts
    .filter((item) => dias.includes(item.date))
    .sort((a, b) => `${a.date}${a.time ?? ""}`.localeCompare(`${b.date}${b.time ?? ""}`));

  function moverEntrenamiento(id: string, date: string) {
    const item = workouts.find((actual) => actual.id === id);
    if (!item || item.status === "completed" || item.status === "skipped") return;
    onUpdate({ ...item, date });
  }

  const propsTarjeta = {
    routines,
    atleta,
    usuarioActual,
    modoCoach,
    onUpdate,
    onDelete,
    onStart,
  };

  return (
    <div
      className={cn(
        embedded
          ? ""
          : "mx-auto max-w-[1600px] px-4 py-7 md:px-8 md:py-10 xl:px-10 xl:py-12",
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200/60">
            {modoCoach ? `Planificación de ${atleta.name}` : "Tu semana deportiva"}
          </div>
          <h1 className="text-3xl font-light tracking-[-0.035em] md:text-4xl">
            Agenda deportiva
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/35 md:text-sm">
            Organizá rutinas y actividades externas en un mismo lugar.
          </p>
        </div>
        <DialogoEntrenamiento
          trigger={
            <Button className="self-start rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200 sm:self-auto">
              <CalendarPlus />
              Programar entrenamiento
            </Button>
          }
          routines={routines}
          atleta={atleta}
          usuarioActual={usuarioActual}
          fechaInicial={fechaSeleccionada}
          onCreate={onCreate}
          onUpdate={onUpdate}
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0d0e13]/75">
          <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
            <div>
              <div className="text-sm font-medium">
                {etiquetaFecha(dias[0], "larga")} —{" "}
                {etiquetaFecha(dias[6], "larga")}
              </div>
              <div className="mt-1 text-[10px] text-white/25">
                {entrenamientosDeSemana.length}{" "}
                {entrenamientosDeSemana.length === 1
                  ? "entrenamiento"
                  : "entrenamientos"}{" "}
                esta semana
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const actual = startOfWeek(hoy);
                  setSemana(actual);
                  setFechaSeleccionada(hoy);
                }}
                className="hidden rounded-full text-[10px] text-white/40 hover:bg-white/[0.06] hover:text-white sm:flex"
              >
                Hoy
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Semana anterior"
                onClick={() => {
                  const anterior = addDays(semana, -7);
                  setSemana(anterior);
                  setFechaSeleccionada(anterior);
                }}
                className="rounded-full text-white/45 hover:bg-white/[0.06] hover:text-white"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Semana siguiente"
                onClick={() => {
                  const siguiente = addDays(semana, 7);
                  setSemana(siguiente);
                  setFechaSeleccionada(siguiente);
                }}
                className="rounded-full text-white/45 hover:bg-white/[0.06] hover:text-white"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 border-b border-white/[0.06] p-2 lg:hidden">
            {dias.map((dia, index) => (
              <button
                key={dia}
                onClick={() => setFechaSeleccionada(dia)}
                className={cn(
                  "rounded-xl px-1 py-2 text-center transition-colors",
                  fechaSeleccionada === dia
                    ? "bg-cyan-300 text-indigo-950"
                    : "text-white/35",
                )}
              >
                <span className="block text-[8px] uppercase">{nombresDias[index]}</span>
                <span className="mt-1 block text-sm">
                  {new Date(`${dia}T12:00:00`).getDate()}
                </span>
                {workouts.some((item) => item.date === dia) && (
                  <span
                    className={cn(
                      "mx-auto mt-1 block size-1 rounded-full",
                      fechaSeleccionada === dia ? "bg-indigo-950" : "bg-cyan-300",
                    )}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-72 p-3 lg:hidden">
            <div className="mb-3 text-xs text-white/45">
              {etiquetaFecha(fechaSeleccionada, "larga")}
            </div>
            <div className="space-y-2">
              {entrenamientosDeSemana
                .filter((item) => item.date === fechaSeleccionada)
                .map((item) => (
                  <TarjetaEntrenamiento
                    key={item.id}
                    item={item}
                    {...propsTarjeta}
                  />
                ))}
              {!entrenamientosDeSemana.some(
                (item) => item.date === fechaSeleccionada,
              ) && (
                <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-white/[0.08] text-center">
                  <div>
                    <CalendarDays className="mx-auto size-5 text-white/20" />
                    <div className="mt-2 text-xs text-white/30">Día libre</div>
                    <div className="mt-1 text-[9px] text-white/20">
                      Programá una rutina o actividad.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden min-h-[440px] grid-cols-7 divide-x divide-white/[0.05] lg:grid">
            {dias.map((dia, index) => {
              const items = entrenamientosDeSemana.filter(
                (item) => item.date === dia,
              );
              return (
                <div
                  key={dia}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) =>
                    moverEntrenamiento(
                      event.dataTransfer.getData("text/plain"),
                      dia,
                    )
                  }
                  className={cn("min-w-0 p-2", dia === hoy && "bg-cyan-300/[0.025]")}
                >
                  <button
                    onClick={() => setFechaSeleccionada(dia)}
                    className="mb-3 w-full rounded-xl py-2 text-center transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="block text-[8px] uppercase tracking-wider text-white/25">
                      {nombresDias[index]}
                    </span>
                    <span
                      className={cn(
                        "mx-auto mt-1 grid size-7 place-items-center rounded-full text-sm text-white/60",
                        dia === hoy && "bg-cyan-300 text-indigo-950",
                      )}
                    >
                      {new Date(`${dia}T12:00:00`).getDate()}
                    </span>
                  </button>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <TarjetaEntrenamiento
                        key={item.id}
                        item={item}
                        {...propsTarjeta}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="rounded-3xl border border-white/[0.07] bg-[#0d0e13]/75 p-4 xl:sticky xl:top-24">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Rutinas disponibles</div>
              <div className="mt-1 text-[10px] text-white/25">
                Programalas cuando quieras.
              </div>
            </div>
            <Dumbbell className="size-4 text-cyan-200/50" />
          </div>
          <div className="mt-4 space-y-2">
            {routines.map((rutina) => (
              <Card
                key={rutina.id}
                className="border-white/[0.07] bg-white/[0.025] text-white shadow-none"
              >
                <CardContent className="p-3">
                  <div className="truncate text-xs font-medium">
                    {rutina.title}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[9px] text-white/25">
                    <Clock3 className="size-3" />
                    {rutina.durationMinutes} min
                  </div>
                  <DialogoEntrenamiento
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 w-full rounded-full text-[10px] text-cyan-100 hover:bg-cyan-300/10 hover:text-cyan-50"
                      >
                        <Plus />
                        Programar
                      </Button>
                    }
                    routines={routines}
                    atleta={atleta}
                    usuarioActual={usuarioActual}
                    fechaInicial={fechaSeleccionada}
                    rutinaInicialId={rutina.id}
                    onCreate={onCreate}
                    onUpdate={onUpdate}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
