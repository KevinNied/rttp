"use client";

import { CheckCircle2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Routine, User } from "@/lib/rttp-data";

import { cantidadEjercicios } from "@/domain/routine/routine-metrics";
import { RoutineTemplate } from "@/domain/routine/routine-factory";
import { DialogoAsignarPlantilla } from "@/features/routine-editor/assign-template-dialog";
import { DialogoGuardarPlantilla } from "@/features/routine-editor/save-template-dialog";
import {
  pageDescriptionClassName,
  pageEyebrowClassName,
  pageTitleClassName,
} from "@/features/shared/page-shell";

export function CoachTemplatesView({
  rutina,
  templates,
  atletas,
  plantillaGuardadaVisible,
  onSaveTemplate,
  onAssignTemplate,
  onDeleteTemplate,
  navegar,
}: {
  rutina?: Routine;
  templates: RoutineTemplate[];
  atletas: User[];
  plantillaGuardadaVisible: boolean;
  onSaveTemplate: (title: string) => void;
  onAssignTemplate: (plantillaId: string, athleteId: number) => void;
  onDeleteTemplate: (plantillaId: string) => void;
  navegar: (action: () => void) => void;
}) {
  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className={pageEyebrowClassName}>
            Biblioteca de plantillas
          </div>
          <h1 className={pageTitleClassName}>Rutinas reutilizables</h1>
          <p className={pageDescriptionClassName}>
            Guardá la rutina abierta como plantilla para reutilizar su
            estructura y pesos base. Cada asignación crea una copia
            independiente para el atleta.
          </p>
        </div>
       {rutina && (
         <DialogoGuardarPlantilla rutina={rutina} onSave={onSaveTemplate} />
       )}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] text-white/55">
       {rutina ? (
         <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5">
           Rutina fuente:{" "}
           <strong className="font-medium text-white/80">
             {rutina.title}
           </strong>
         </span>
       ) : (
         <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5">
           Creá o abrí una rutina para guardarla como plantilla.
         </span>
       )}
        {plantillaGuardadaVisible && (
          <span
            role="status"
            className="inline-flex items-center gap-1.5 text-emerald-200"
          >
            <CheckCircle2 className="size-3.5" />
            Plantilla creada
          </span>
        )}
      </div>
      <div className="rounded-3xl border border-white/[0.07] bg-app-surface/70 p-4 md:p-5 xl:p-6">
        {templates.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-5 text-xs text-white/35">
            Todavía no tenés plantillas. Personalizá una rutina y guardala
            acá para asignarla rápidamente.
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
                  {countLabel(cantidadEjercicios(plantilla), "ejercicio")}
                  {plantilla.durationMinutes
                    ? ` · ${plantilla.durationMinutes} min`
                    : ""}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <DialogoAsignarPlantilla
                    plantilla={plantilla}
                    atletas={atletas}
                    onAssign={(athleteId) =>
                      navegar(() =>
                        onAssignTemplate(plantilla.id, athleteId),
                      )
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
                    <DialogContent className="border-white/10 bg-app-panel text-white">
                      <DialogHeader>
                        <DialogTitle>
                          ¿Eliminar “{plantilla.title}”?
                        </DialogTitle>
                        <DialogDescription className="text-white/40">
                          La plantilla dejará de estar disponible para
                          nuevas asignaciones. Las rutinas que ya asignaste
                          no se modificarán.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose
                          render={
                            <Button
                              variant="ghost"
                              className="text-white/50"
                            />
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
  );
}
