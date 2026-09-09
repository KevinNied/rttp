"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  LayoutGrid,
  ListChecks,
  MoveHorizontal,
  RotateCcw,
  SkipForward,
  TimerReset,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatDuration } from "@/lib/format";
import { Routine } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

import { repeticionesObjetivo } from "@/domain/routine/routine-metrics";
import { pasosDeRutina } from "@/domain/routine/routine-steps";
import {
  elapsedSecondsForTimer,
  RestTimerState,
  TrainingSetRecord,
  WorkoutTimerState,
} from "@/domain/workout/workout-session";
import { CampoPrescripcion } from "@/features/workout/prescription-field";
import { WorkoutOverviewSheet } from "@/features/workout/workout-overview-sheet";
import { WorkoutRoundSummary } from "@/features/workout/workout-round-summary";
import { WorkoutSkipSheet } from "@/features/workout/workout-skip-sheet";
import { TextWithLinks } from "@/features/shared/text-with-links";

export function WorkoutMode({
  rutina,
  sesionId,
  timer,
  registros,
  setRegistros,
  indiceActivo,
  setIndiceActivo,
  restTimer,
  setRestTimer,
  onExit,
  onFinish,
}: {
  rutina: Routine;
  sesionId: string;
  timer: WorkoutTimerState;
  registros: Record<string, TrainingSetRecord>;
  setRegistros: React.Dispatch<
    React.SetStateAction<Record<string, TrainingSetRecord>>
  >;
  indiceActivo: number;
  setIndiceActivo: React.Dispatch<React.SetStateAction<number>>;
  restTimer: RestTimerState | null;
  setRestTimer: React.Dispatch<React.SetStateAction<RestTimerState | null>>;
  onExit: () => void;
  onFinish: () => void;
}) {
  const pasos = pasosDeRutina(rutina, sesionId);
  const paso = pasos[indiceActivo];
  const section = rutina.structure.sections[paso.sectionIndex];
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    elapsedSecondsForTimer(timer),
  );
  const [restSeconds, setRestSeconds] = useState(() => {
    if (!restTimer || restTimer.stepId !== paso.stepId) return 0;
    const runningSeconds = restTimer.runningSince
      ? Math.floor((Date.now() - Date.parse(restTimer.runningSince)) / 1000)
      : 0;
    return Math.max(0, restTimer.remainingSeconds - runningSeconds);
  });
  const [vistaCalentamiento, setVistaCalentamiento] = useState<
    "resumida" | "tarjetas"
  >("resumida");
  const inicioPointer = useRef<number | null>(null);
  const distanciaPointer = useRef(0);
  const isCompactSection =
    section.kind === "rounds" &&
    section.exercises.length > 1 &&
    (section.presentation === "compact" ||
      /entrada|activación|movilidad/i.test(section.name));
  const registrosResueltos = pasos.filter((item) => {
    const itemRecord = registros[item.stepId];
    return itemRecord?.completed || itemRecord?.skipped;
  }).length;
  const registrosPospuestos = pasos.filter(
    (item) =>
      registros[item.stepId]?.deferred && !registros[item.stepId]?.completed,
  ).length;

  function siguienteIndiceDisponible(
    desde: number,
    idsOmitidos: ReadonlySet<string> = new Set(),
    pospuestos = false,
  ) {
    for (let index = desde; index < pasos.length; index += 1) {
      const candidato = pasos[index];
      const candidatoRecord = registros[candidato.stepId];
      if (
        !idsOmitidos.has(candidato.stepId) &&
        !candidatoRecord?.completed &&
        !candidatoRecord?.skipped &&
        Boolean(candidatoRecord?.deferred) === pospuestos
      ) {
        return index;
      }
    }
    return -1;
  }

  function siguienteIndiceDeFlujo(
    desde: number,
    idsOmitidos: ReadonlySet<string> = new Set(),
  ) {
    const siguienteRegular = siguienteIndiceDisponible(desde, idsOmitidos);
    return siguienteRegular >= 0
      ? siguienteRegular
      : siguienteIndiceDisponible(0, idsOmitidos, true);
  }

  const proximoIndice = siguienteIndiceDeFlujo(
    indiceActivo + 1,
    new Set([paso.stepId]),
  );
  const proximo = proximoIndice >= 0 ? pasos[proximoIndice] : undefined;
  const hayPasoPosterior = pasos.some((item, index) => {
    if (index === indiceActivo || index === proximoIndice) return false;
    const itemRecord = registros[item.stepId];
    return !itemRecord?.completed && !itemRecord?.skipped;
  });
  const registroAnterior = pasos
    .slice(0, indiceActivo)
    .reverse()
    .map((item) => (item.id === paso.id ? registros[item.stepId] : undefined))
    .find((item) => item?.completed && !item.skipped);
  const valorInicial: TrainingSetRecord = {
    weight: registroAnterior?.weight ?? paso.weight,
    reps: registroAnterior?.reps ?? paso.minReps,
    completed: false,
    skipped: false,
  };
  const registro = registros[paso.stepId] ?? valorInicial;
  const mostrarVistaResumida =
    isCompactSection && vistaCalentamiento === "resumida" && !registro.deferred;

  useEffect(() => {
    let timeoutId: number;
    const updateElapsedTime = () => {
      const nextElapsedSeconds = elapsedSecondsForTimer(timer);
      setElapsedSeconds((current) =>
        current === nextElapsedSeconds ? current : nextElapsedSeconds,
      );
    };
    const scheduleUpdate = () => {
      updateElapsedTime();
      timeoutId = window.setTimeout(scheduleUpdate, 250);
    };
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") updateElapsedTime();
    };

    scheduleUpdate();
    window.addEventListener("focus", updateElapsedTime);
    window.addEventListener("pageshow", updateElapsedTime);
    document.addEventListener("visibilitychange", syncWhenVisible);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("focus", updateElapsedTime);
      window.removeEventListener("pageshow", updateElapsedTime);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [timer]);

  useEffect(() => {
    if (!restTimer || restTimer.stepId !== paso.stepId) {
      return;
    }

    const updateRest = () => {
      const runningSeconds = restTimer.runningSince
        ? Math.floor((Date.now() - Date.parse(restTimer.runningSince)) / 1000)
        : 0;
      const remaining = Math.max(
        0,
        restTimer.remainingSeconds - runningSeconds,
      );
      setRestSeconds(remaining);
      if (remaining === 0 && restTimer.runningSince) {
        setRestTimer({ ...restTimer, remainingSeconds: 0, runningSince: null });
      }
    };
    if (!restTimer.runningSince) return;
    const interval = window.setInterval(updateRest, 1000);
    return () => window.clearInterval(interval);
  }, [paso.stepId, restTimer, setRestTimer]);

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
    setRestTimer(null);
    if (registro.deferred) {
      setRegistros((actuales) => ({
        ...actuales,
        [paso.stepId]: {
          ...(actuales[paso.stepId] ?? valorInicial),
          deferred: false,
        },
      }));
    }
    const siguiente = siguienteIndiceDeFlujo(indiceActivo + 1);

    if (siguiente < 0) {
      onFinish();
    } else {
      setIndiceActivo(siguiente);
    }
  }

  function omitir(alcance: "serie" | "ejercicio" | "seccion") {
    const objetivos = pasos.filter((item, index) => {
      if (index < indiceActivo) return false;
      if (alcance === "serie") return index === indiceActivo;
      if (alcance === "ejercicio") return item.id === paso.id;
      return item.sectionId === paso.sectionId;
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
              deferred: false,
            };
        siguientes[item.stepId].deferred = false;
      });
      return siguientes;
    });

    const siguiente = siguienteIndiceDeFlujo(indiceActivo + 1, idsOmitidos);

    if (siguiente < 0) {
      onFinish();
    } else {
      setIndiceActivo(siguiente);
    }
    setDragX(0);
  }

  function posponerEjercicio() {
    const objetivos = pasos.filter(
      (item, index) =>
        index >= indiceActivo &&
        item.id === paso.id &&
        !registros[item.stepId]?.completed &&
        !registros[item.stepId]?.skipped,
    );
    const idsPospuestos = new Set(objetivos.map((item) => item.stepId));
    if (objetivos.length === 0) {
      avanzar();
      return;
    }

    setRegistros((actuales) => {
      const siguientes = { ...actuales };
      objetivos.forEach((item) => {
        siguientes[item.stepId] = {
          ...(actuales[item.stepId] ?? {
            weight: item.weight,
            reps: item.minReps,
            completed: false,
            skipped: false,
          }),
          deferred: true,
        };
      });
      return siguientes;
    });

    const siguienteRegular = siguienteIndiceDisponible(
      indiceActivo + 1,
      idsPospuestos,
    );
    const primerPospuesto = pasos.findIndex(
      (item) =>
        idsPospuestos.has(item.stepId) ||
        Boolean(registros[item.stepId]?.deferred),
    );
    setIndiceActivo(
      siguienteRegular >= 0 ? siguienteRegular : Math.max(0, primerPospuesto),
    );
    setRestTimer(null);
    setDragX(0);
    setMensaje("Lo dejamos pendiente para el final");
    window.setTimeout(() => setMensaje(""), 1800);
  }

  function volver() {
    setDragX(0);
    setRestTimer(null);
    setIndiceActivo((indice) => Math.max(0, indice - 1));
  }

  function iniciarDescanso() {
    if (paso.restSeconds === null || paso.restSeconds <= 0 || !proximo) {
      setRestTimer(null);
      return;
    }
    setRestSeconds(paso.restSeconds);
    setRestTimer({
      stepId: paso.stepId,
      remainingSeconds: paso.restSeconds,
      runningSince: new Date().toISOString(),
    });
  }

  function toggleDescanso() {
    if (!restTimer || restTimer.stepId !== paso.stepId || restSeconds === 0) {
      return;
    }
    setRestTimer({
      stepId: paso.stepId,
      remainingSeconds: restSeconds,
      runningSince: restTimer.runningSince ? null : new Date().toISOString(),
    });
  }

  function completarRondaResumida() {
    const objetivos = pasos.filter((item) => {
      const itemRecord = registros[item.stepId];
      return (
        item.sectionId === paso.sectionId &&
        item.round === paso.round &&
        !itemRecord?.deferred &&
        !itemRecord?.skipped
      );
    });
    const ids = new Set(objetivos.map((item) => item.stepId));

    setRegistros((actuales) => {
      const siguientes = { ...actuales };
      objetivos.forEach((item) => {
        siguientes[item.stepId] = {
          weight: actuales[item.stepId]?.weight ?? item.weight,
          reps: actuales[item.stepId]?.reps ?? item.minReps,
          completed: true,
          skipped: false,
          deferred: false,
        };
      });
      return siguientes;
    });

    const ultimoIndice = pasos.reduce(
      (ultimo, item, index) => (ids.has(item.stepId) ? index : ultimo),
      indiceActivo,
    );
    const siguiente = siguienteIndiceDeFlujo(ultimoIndice + 1, ids);
    if (siguiente < 0) {
      onFinish();
    } else {
      setIndiceActivo(siguiente);
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
          <div className="min-w-0 px-3 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-50/90">
              Rutina en curso
            </div>
            <div className="mt-1 flex min-w-0 items-center justify-center gap-2 text-xs font-medium text-indigo-50/65">
              <span className="max-w-44 truncate">{rutina.title}</span>
              <span className="text-white/25">·</span>
              <span className="inline-flex shrink-0 items-center gap-1 tabular-nums text-cyan-50/75">
                <Clock3 className="size-3" />
                {formatDuration(elapsedSeconds)}
              </span>
            </div>
          </div>
          <WorkoutOverviewSheet
            rutina={rutina}
            pasos={pasos}
            paso={paso}
            registros={registros}
            registrosResueltos={registrosResueltos}
            registrosPospuestos={registrosPospuestos}
          />
        </div>
        <Progress
          value={(registrosResueltos / pasos.length) * 100}
          className="h-1 bg-indigo-300/10"
        />
      </div>

      <div className="mx-auto mt-3 flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-y-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:max-w-4xl">
        {isCompactSection && (
          <div className="mb-3 flex items-center justify-between rounded-full border border-white/[0.08] bg-white/[0.025] p-1 pl-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/60">
              Vista de la sección
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
                    "flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-medium transition-colors",
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
        <div className="mb-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-100/65">
            Sección {paso.sectionIndex + 1} de{" "}
            {rutina.structure.sections.length}
          </div>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div className="min-w-0 truncate text-sm font-medium text-white/90">
              {paso.sectionName}
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium">
              {paso.sectionKind === "rounds" ? (
                <>
                  <span className="rounded-full bg-violet-300/10 px-2.5 py-1 text-violet-100/80">
                    Ronda {paso.round} de {paso.rondas}
                  </span>
                  <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-cyan-100/80">
                    Ejercicio {paso.posicion + 1} de {paso.ejerciciosEnRonda}
                  </span>
                </>
              ) : (
                <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-cyan-100/80">
                  Serie {paso.round} de {paso.sets}
                </span>
              )}
            </div>
          </div>
        </div>

        {mostrarVistaResumida ? (
          <WorkoutRoundSummary
            section={section}
            paso={paso}
            pasos={pasos}
            registros={registros}
            completarRondaResumida={completarRondaResumida}
            omitir={omitir}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="relative">
              {hayPasoPosterior && (
                <div className="absolute inset-x-8 bottom-0 top-4 rounded-[2rem] border border-blue-200/[0.06] bg-blue-300/[0.025]" />
              )}
              {proximo && (
                <div className="absolute inset-x-4 bottom-0 top-2 rounded-[2rem] border border-violet-200/[0.09] bg-violet-300/[0.045]" />
              )}
              <div
                role="group"
                aria-label={`${paso.name}, ${
                  paso.sectionKind === "rounds" ? "ronda" : "serie"
                } ${paso.round}`}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
                onPointerCancel={() => {
                  inicioPointer.current = null;
                  setDragging(false);
                  setDragX(0);
                }}
                className={cn(
                  "relative z-10 select-none overflow-hidden rounded-[2rem] border bg-app-panel p-5 pb-5 shadow-[0_30px_80px_rgba(0,0,0,.5)] sm:p-6",
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
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-50/65">
                        {registro.deferred
                          ? "Retomado para completar"
                          : "Ejercicio actual"}
                      </div>
                      <h1 className="mt-2 text-[2rem] font-normal leading-tight tracking-[-0.04em]">
                        {paso.name}
                      </h1>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <WorkoutSkipSheet
                        rutina={rutina}
                        paso={paso}
                        registro={registro}
                        posponerEjercicio={posponerEjercicio}
                        omitir={omitir}
                      />
                      {(registro.completed || registro.skipped) && (
                        <div
                          className={cn(
                            "grid size-10 place-items-center rounded-full border",
                            registro.completed
                              ? "border-cyan-200/25 bg-cyan-300 text-indigo-950"
                              : "border-orange-200/20 bg-orange-300/10 text-orange-200",
                          )}
                        >
                          {registro.completed ? <Check /> : <SkipForward />}
                        </div>
                      )}
                    </div>
                  </div>

                  {paso.instructions && (
                    <div className="mt-4 flex w-full flex-col rounded-xl border border-violet-300/15 bg-violet-300/[0.07] px-3.5 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-100/65">
                        Aclaraciones
                      </span>
                      <span className="mt-1 text-[13px] font-medium leading-relaxed text-violet-50/85">
                        <TextWithLinks>{paso.instructions}</TextWithLinks>
                      </span>
                    </div>
                  )}

                  {paso.restSeconds !== null &&
                    (!restTimer || restTimer.stepId !== paso.stepId) && (
                      <div className="mt-3 flex items-center justify-between rounded-xl border border-blue-300/15 bg-blue-400/[0.07] px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="grid size-8 place-items-center rounded-full bg-blue-300/10 text-blue-200">
                            <TimerReset className="size-3.5" />
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-100/65">
                              Descanso
                            </div>
                            <div className="mt-0.5 text-[11px] font-medium text-blue-50/70">
                              Entre series
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-medium tabular-nums text-blue-50">
                          {paso.restSeconds}
                          <span className="ml-1 text-[11px] text-blue-50/60">
                            s
                          </span>
                        </div>
                      </div>
                    )}

                  {restTimer?.stepId === paso.stepId && (
                    <div
                      role="timer"
                      aria-live="polite"
                      className="mt-3 rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.08] px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-50/70">
                            {restSeconds > 0
                              ? "Descanso activo"
                              : "Descanso terminado"}
                          </div>
                          <div className="mt-1 text-3xl font-medium tabular-nums text-cyan-50">
                            {formatDuration(restSeconds)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {restSeconds > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={toggleDescanso}
                              className="rounded-full border-cyan-200/15 bg-cyan-300/[0.06] text-cyan-100 hover:bg-cyan-300/12"
                            >
                              {restTimer.runningSince ? "Pausar" : "Reanudar"}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRestTimer(null)}
                            className="rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"
                          >
                            Omitir
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Separator className="mb-4 bg-indigo-200/[0.08]" />

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
                        emptyWhenZero
                        value={registro.weight}
                        onChange={(weight) => actualizar({ weight })}
                      />
                    </div>

                    <Button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        const completing = !registro.completed;
                        actualizar({
                          completed: completing,
                          skipped: false,
                        });
                        if (completing) iniciarDescanso();
                        else setRestTimer(null);
                      }}
                      className={cn(
                        "mt-5 h-13 w-full rounded-full text-[15px] font-semibold",
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
            </div>

            <div className="mt-auto pt-4">
              <div className="text-center">
                <div
                  className={cn(
                    "h-5 text-[11px] font-medium text-orange-100 transition-opacity",
                    mensaje ? "opacity-100" : "opacity-0",
                  )}
                >
                  {mensaje}
                </div>
                <div className="mt-1 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-50/65">
                  <MoveHorizontal className="size-3.5" />
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
                  {proximo ? "Siguiente" : "Finalizar"}
                  <ArrowRight />
                </Button>
              </div>

              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-indigo-200/[0.1] bg-indigo-300/[0.055] px-4 py-3.5">
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan-300/[0.08] text-cyan-100/55">
                  <ArrowRight className="size-3.5" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-indigo-50/65">
                    {!proximo
                      ? "Último paso"
                      : registros[proximo.stepId]?.deferred
                        ? "Pendiente para después"
                        : proximo.id === paso.id
                          ? "Siguiente serie"
                          : "Siguiente ejercicio"}
                  </div>
                  <div className="mt-1 text-sm font-medium leading-snug text-indigo-50/85">
                    {proximo?.name ?? "Finalizar rutina"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
