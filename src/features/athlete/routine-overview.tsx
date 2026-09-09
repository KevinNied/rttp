"use client";

import { Check, Dumbbell, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { countLabel } from "@/lib/format";
import { Routine } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

import {
  cantidadEjercicios,
  repeticionesObjetivo,
  sectionKindLabel,
} from "@/domain/routine/routine-metrics";
import { TextWithLinks } from "@/features/shared/text-with-links";

export function OverviewRutina({
  rutina,
  authorLabel,
  className,
}: {
  rutina: Routine;
  authorLabel: string;
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
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden border-white/10 bg-app-surface p-0 text-white sm:max-w-3xl">
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
            <span className="mb-1 block text-cyan-100/60">{authorLabel}</span>
            {countLabel(
              rutina.structure.sections.length,
              "sección",
              "secciones",
            )}{" "}
            · {countLabel(ejercicios, "ejercicio")}
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
                <h3 className="mt-4 text-lg font-medium">
                  Rutina en preparación
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-white/38">
                  Esta rutina todavía no tiene ejercicios. Cuando esté
                  completa, vas a poder revisar el detalle y arrancarla desde
                  la app.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative before:absolute before:bottom-5 before:left-[19px] before:top-5 before:w-px before:bg-gradient-to-b before:from-cyan-300/60 before:via-violet-400/45 before:to-blue-400/25 md:before:left-1/2">
                {rutina.structure.sections.map((section, index) => (
                  <div
                    key={section.id}
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
                            Sección {index + 1}
                          </div>
                          <h3 className="mt-1 text-sm font-medium">
                            {section.name}
                          </h3>
                        </div>
                        <Badge className="border-white/10 bg-black/25 text-[8px] text-white/45">
                          {sectionKindLabel(section.kind)}
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-2 border-t border-white/[0.07] pt-3">
                        {section.exercises.map((item) => (
                          <div key={item.id} className="flex items-start gap-2">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-white/30" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-[11px] text-white/75">
                                  {item.name}
                                </span>
                                <span className="shrink-0 text-[9px] tabular-nums text-white/35">
                                  {item.sets}×{repeticionesObjetivo(item)}
                                  {item.weight > 0
                                    ? ` · ${item.weight} kg`
                                    : ""}
                                  {item.restSeconds !== null
                                    ? ` · ${item.restSeconds} s`
                                    : ""}
                                </span>
                              </div>
                              {item.instructions && (
                                <div className="mt-0.5 truncate text-[9px] text-violet-200/40">
                                  <TextWithLinks>
                                    {item.instructions}
                                  </TextWithLinks>
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
