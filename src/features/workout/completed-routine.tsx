"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Flame,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration } from "@/lib/format";
import { User } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

export function RutinaCompletada({
  atleta,
  elapsedSeconds,
  feedback,
  setFeedback,
  hasCoach,
  onReview,
  onDone,
}: {
  atleta: User;
  elapsedSeconds: number;
  feedback: string;
  setFeedback: (value: string) => void;
  hasCoach: boolean;
  onReview: () => void;
  onDone: (effort: number) => void;
}) {
  const [effort, setEsfuerzo] = useState<number | null>(null);
  return (
    <div className="mx-auto grid min-h-dvh max-w-5xl place-items-center px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] md:px-8 xl:px-10">
      <Card className="w-full border-violet-200/[0.12] bg-app-panel text-center text-white shadow-[0_30px_90px_rgba(0,0,0,.5)]">
        <CardContent className="p-6 md:p-9 xl:grid xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] xl:items-center xl:gap-10 xl:p-12">
          <div>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-400 text-indigo-950">
              <Trophy className="size-6" />
            </div>
            <h1 className="mt-5 text-3xl font-light"> Rutina completada</h1>
            <p className="mt-2 text-xs text-content-muted">
              Excelente trabajo, {atleta.name}.
            </p>
            <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-300/[0.07] px-4 py-2 text-cyan-100/75">
              <Clock3 className="size-4" />
              <span className="text-sm tabular-nums">
                {formatDuration(elapsedSeconds)}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-content-muted">
                Tiempo total
              </span>
            </div>
            <fieldset className="my-6">
              <legend className="mb-3 text-sm font-medium text-content-secondary">
                Esfuerzo percibido
              </legend>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value} className="cursor-pointer rounded-full">
                    <input
                      id={`effort-${value}`}
                      type="radio"
                      name="effort"
                      value={value}
                      checked={effort === value}
                      onChange={() => setEsfuerzo(value)}
                      onKeyDown={(event) => {
                        if (
                          ![
                            "ArrowLeft",
                            "ArrowRight",
                            "ArrowUp",
                            "ArrowDown",
                          ].includes(event.key)
                        ) {
                          return;
                        }
                        event.preventDefault();
                        const direction =
                          event.key === "ArrowRight" ||
                          event.key === "ArrowDown"
                            ? 1
                            : -1;
                        const nextEffort = ((value - 1 + direction + 5) % 5) + 1;
                        setEsfuerzo(nextEffort);
                        requestAnimationFrame(() =>
                          document.getElementById(`effort-${nextEffort}`)?.focus(),
                        );
                      }}
                      aria-label={`Esfuerzo ${value} de 5`}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-11 place-items-center rounded-full border transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/70",
                        effort !== null && value <= effort
                          ? "border-orange-500/40 bg-orange-500/12 text-orange-700 dark:border-orange-200/30 dark:bg-orange-300/10 dark:text-orange-300"
                          : "border-border text-content-muted",
                      )}
                    >
                      <Flame
                        className={cn(
                          "size-4",
                          effort !== null && value <= effort && "fill-current",
                        )}
                      />
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-content-muted">
                {effort === null
                  ? "Elegí una opción para guardar la actividad"
                  : `Seleccionaste ${effort} de 5`}
              </p>
            </fieldset>
          </div>
          <div className="xl:text-left">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-content-secondary">
                {hasCoach
                  ? "Comentario para tu entrenador"
                  : "Nota sobre esta sesión"}
              </span>
              <Textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder={
                  hasCoach
                    ? "Contale cómo te sentiste o qué querés ajustar."
                    : "Guardá cómo te sentiste o qué querés ajustar."
                }
                className="min-h-24 border-input bg-app-surface text-foreground placeholder:text-content-muted dark:bg-black/30"
              />
            </label>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={onReview}
                className="h-12 flex-1 rounded-full"
              >
                <ArrowLeft />
                Revisar entrenamiento
              </Button>
              <Button
                onClick={() => effort !== null && onDone(effort)}
                disabled={effort === null}
                className="h-12 flex-1 rounded-full"
              >
                Guardar actividad
                <CheckCircle2 />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
