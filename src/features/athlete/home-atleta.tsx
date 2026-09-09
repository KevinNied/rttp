"use client";

import { ArrowRight, Clock3, Dumbbell, LayoutGrid } from "lucide-react";

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
import { countLabel } from "@/lib/format";
import { Routine } from "@/lib/rttp-data";

import {
  cantidadEjercicios,
  rutinaTieneEjercicios,
} from "@/domain/routine/routine-metrics";
import { SelectorRutina } from "@/features/routine-editor/selector-rutina";
import { OverviewRutina } from "@/features/athlete/overview-rutina";
import {
  desktopPageShellClassName,
  pageDescriptionClassName,
  pageEyebrowClassName,
  pageTitleClassName,
} from "@/features/shared/page-shell";
import { TextWithLinks } from "@/features/shared/text-with-links";

export function HomeAtleta({
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
            Revisá tus planes, detectá cuáles todavía están en preparación y
            empezá solo cuando la rutina ya tenga el contenido cargado.
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
              {countLabel(routines.length, "plan", "planes")}
            </span>
          </div>
          <SelectorRutina
            routines={routines}
            rutinaActiva={rutina}
            onSelect={onSelect}
            desktopVertical
          />
        </aside>

        <Card className="relative overflow-hidden border-white/[0.09] bg-app-panel text-white shadow-[0_30px_80px_rgba(0,0,0,.45)]">
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
                  [Dumbbell, countLabel(ejerciciosRutinaActiva, "ejercicio")],
                  [
                    LayoutGrid,
                    countLabel(
                      rutina.structure.sections.length,
                      "sección",
                      "secciones",
                    ),
                  ],
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
                    Tu entrenador todavía no cargó ejercicios en esta rutina.
                    Podés revisar otra asignación o esperar a que la complete.
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
                    <DialogContent className="border-white/10 bg-app-panel text-white">
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
