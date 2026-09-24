"use client";

import {
  ArrowRight,
  CalendarDays,
  Dumbbell,
  History,
  LayoutTemplate,
  UserPlus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Routine, User } from "@/lib/rttp-data";

import { coachAthletePath } from "@/application/navigation/routes";
import { cantidadEjercicios } from "@/domain/routine/routine-metrics";
import { RoutineTemplate } from "@/domain/routine/routine-factory";
import { DialogoNuevoAtleta } from "@/features/routine-editor/new-athlete-dialog";
import {
  pageDescriptionClassName,
  pageEyebrowClassName,
  pageTitleClassName,
} from "@/features/shared/page-shell";

export function CoachOverviewView({
  users,
  atletas,
  atletaSeleccionado,
  templates,
  rutinasPorAtleta,
  onCreateAtleta,
  onSelectAtleta,
  navigate,
}: {
  users: User[];
  atletas: User[];
  atletaSeleccionado?: User;
  templates: RoutineTemplate[];
  rutinasPorAtleta: Routine[];
  onCreateAtleta: (name: string, email: string) => Promise<string | null>;
  onSelectAtleta: (id: number) => void;
  navigate: (path: string) => void;
}) {
  const pendientes = atletas
    .map((atleta) => ({
      atleta,
      cantidad: rutinasPorAtleta.filter(
        (rutina) =>
          rutina.athleteId === atleta.id && cantidadEjercicios(rutina) === 0,
      ).length,
    }))
    .filter((item) => item.cantidad > 0);
  const prioridad = pendientes[0];

  function abrirAtleta(
    atleta: User,
    section: "routines" | "schedule" | "history" = "routines",
  ) {
    onSelectAtleta(atleta.id);
    navigate(coachAthletePath(atleta.id, section));
  }

  return (
    <section>
      <div className="mb-7">
        <div className={pageEyebrowClassName}>Inicio</div>
        <h1 className={pageTitleClassName}>¿Dónde seguimos hoy?</h1>
        <p className={pageDescriptionClassName}>
          Retomá el trabajo más importante sin recorrer todo el workspace.
        </p>
      </div>

      {atletas.length === 0 ? (
        <Card variant="hero" className="max-w-3xl">
          <CardContent className="p-6 md:p-8">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-info dark:text-primary">
              <UserPlus className="size-5" />
            </div>
            <div className="mt-5 max-w-xl">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-info dark:text-primary">
                Tu workspace está listo
              </div>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">
                Sumá tu primer atleta
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-content-muted">
                Creá su perfil para empezar a armar rutinas, organizar la
                agenda y acompañar su entrenamiento.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <DialogoNuevoAtleta
                users={users}
                onCreate={onCreateAtleta}
                triggerLabel="Agregar primer atleta"
              />
              {templates.length > 0 && (
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => navigate("/coach/templates")}
                >
                  Ver plantillas
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card
            variant={prioridad ? "hero" : "raised"}
            className={
              prioridad
                ? "border-warning/25 bg-warning/[0.045]"
                : "border-success/20 bg-success/[0.04]"
            }
          >
            <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
              <div className="max-w-2xl">
                <div
                  className={
                    prioridad
                      ? "text-xs font-semibold uppercase tracking-[0.16em] text-warning"
                      : "text-xs font-semibold uppercase tracking-[0.16em] text-success"
                  }
                >
                  {prioridad ? "Requiere atención" : "Todo al día"}
                </div>
                <h2 className="mt-2 text-xl font-medium">
                  {prioridad
                    ? `${prioridad.atleta.name} tiene ${prioridad.cantidad} ${prioridad.cantidad === 1 ? "rutina incompleta" : "rutinas incompletas"}`
                    : "No hay rutinas incompletas"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-content-muted">
                  {prioridad
                    ? "Completá sus ejercicios antes de asignar nuevas cargas."
                    : "Podés continuar con el atleta seleccionado o preparar una plantilla."}
                </p>
              </div>
              {prioridad && (
                <Button
                  className="shrink-0 rounded-full"
                  onClick={() => abrirAtleta(prioridad.atleta)}
                >
                  Abrir rutina
                  <ArrowRight />
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
            {atletaSeleccionado && (
              <Card variant="raised">
                <CardContent className="p-5 md:p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-info dark:text-primary">
                    Continuar
                  </div>
                  <h2 className="mt-2 text-xl font-medium">
                    {atletaSeleccionado.name}
                  </h2>
                  <p className="mt-2 text-sm text-content-muted">
                    Entrá directamente al contexto que necesitás revisar.
                  </p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {[
                      ["routines", "Rutinas", Dumbbell],
                      ["schedule", "Agenda", CalendarDays],
                      ["history", "Historial", History],
                    ].map(([section, label, Icon]) => {
                      const ActionIcon = Icon as typeof Dumbbell;
                      return (
                        <Button
                          key={section as string}
                          variant="outline"
                          className="justify-between rounded-xl"
                          onClick={() =>
                            abrirAtleta(
                              atletaSeleccionado,
                              section as "routines" | "schedule" | "history",
                            )
                          }
                        >
                          <span className="inline-flex items-center gap-2">
                            <ActionIcon />
                            {label as string}
                          </span>
                          <ArrowRight />
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card variant="flat">
              <CardContent className="p-5 md:p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-content-muted">
                  Accesos
                </div>
                <div className="mt-4 grid gap-2">
                  <Button
                    variant="ghost"
                    className="justify-between rounded-xl"
                    onClick={() => navigate("/coach/athletes")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Users />
                      Todos los atletas
                    </span>
                    <ArrowRight />
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-between rounded-xl"
                    onClick={() => navigate("/coach/templates")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <LayoutTemplate />
                      Plantillas
                    </span>
                    <ArrowRight />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
