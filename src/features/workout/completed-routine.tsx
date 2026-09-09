"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, Flame, Trophy } from "lucide-react";

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
  onDone,
}: {
  atleta: User;
  elapsedSeconds: number;
  feedback: string;
  setFeedback: (value: string) => void;
  onDone: (effort: number) => void;
}) {
  const [effort, setEsfuerzo] = useState(4);
  return (
    <div className="mx-auto grid min-h-dvh max-w-5xl place-items-center px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] md:px-8 xl:px-10">
      <Card className="w-full border-violet-200/[0.12] bg-app-panel text-center text-white shadow-[0_30px_90px_rgba(0,0,0,.5)]">
        <CardContent className="p-6 md:p-9 xl:grid xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] xl:items-center xl:gap-10 xl:p-12">
          <div>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-400 text-indigo-950">
              <Trophy className="size-6" />
            </div>
            <h1 className="mt-5 text-3xl font-light"> Rutina completada</h1>
            <p className="mt-2 text-xs text-indigo-100/40">
              Excelente trabajo, {atleta.name}.
            </p>
            <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-300/[0.07] px-4 py-2 text-cyan-100/75">
              <Clock3 className="size-4" />
              <span className="text-sm tabular-nums">
                {formatDuration(elapsedSeconds)}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-cyan-100/35">
                Tiempo total
              </span>
            </div>
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
