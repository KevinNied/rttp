"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import { ArrowLeft, Check, LockKeyhole, Plus, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { countLabel } from "@/lib/format";
import { Routine, User } from "@/lib/rttp-data";

import { cantidadEjercicios } from "@/domain/routine/routine-metrics";
import { DialogoEjercicio } from "@/features/routine-editor/dialogo-ejercicio";
import { FilaEjercicio } from "@/features/routine-editor/fila-ejercicio";
import { RoutineDetailsFields } from "@/features/routine-editor/routine-details-fields";
import { SeccionEditor } from "@/features/routine-editor/seccion-editor";
import { useRoutineEditor } from "@/features/routine-editor/use-routine-editor";
import { desktopPageShellClassName } from "@/features/shared/page-shell";

export function AthleteRoutineEditor({
  routine: savedRoutine,
  coach,
  onSave,
  onClose,
  onDirtyChange,
}: {
  routine: Routine;
  coach?: User;
  onSave: (routine: Routine) => void;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const editor = useRoutineEditor(savedRoutine);
  const {
    rutina,
    setRutina,
    openSectionId,
    setOpenSectionId,
    sensors,
    actualizarEjercicio,
    eliminarEjercicio,
    updateSectionKind,
    agregarEjercicio,
    agregarEjercicioVacio,
    moverEjercicio,
  } = editor;
  const [savedVisible, setSavedVisible] = useState(false);
  const hasChanges = JSON.stringify(rutina) !== JSON.stringify(savedRoutine);
  const hasUnnamedExercises = rutina.structure.sections.some((section) =>
    section.exercises.some((exercise) => !exercise.name.trim()),
  );
  const hasInvalidDetails = !rutina.title.trim();
  const isShared = coach
    ? rutina.sharedWithCoachId === coach.id
    : false;

  useEffect(() => {
    if (!hasChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasChanges]);

  useEffect(() => {
    onDirtyChange(hasChanges);
    return () => onDirtyChange(false);
  }, [hasChanges, onDirtyChange]);

  function save() {
    onSave(rutina);
    setSavedVisible(true);
    window.setTimeout(() => setSavedVisible(false), 1800);
  }

  function close() {
    if (
      hasChanges &&
      !window.confirm(
        "Tenés cambios sin guardar. ¿Querés descartarlos y volver a tus rutinas?",
      )
    ) {
      return;
    }
    onClose();
  }

  return (
    <div className={desktopPageShellClassName}>
      <button
        type="button"
        onClick={close}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-white/45 transition-colors hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        Volver a rutinas
      </button>

      <Card className="overflow-hidden border-white/[0.08] bg-app-panel text-white shadow-[0_24px_70px_rgba(37,28,100,.18)]">
        <CardHeader className="border-b border-indigo-200/[0.07] p-4 md:p-5 xl:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-100/70">
                Creada por vos
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs text-white/65">
                  {countLabel(cantidadEjercicios(rutina), "ejercicio")}
                </span>
                {!hasChanges && (
                  <div className="flex items-center gap-1 text-xs text-cyan-200/70">
                    <Check className="size-3.5" />
                    {savedVisible ? "Cambios guardados" : "Guardado"}
                  </div>
                )}
                {coach && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRutina((current) => ({
                        ...current,
                        sharedWithCoachId: isShared ? null : coach.id,
                      }))
                    }
                    className="rounded-full border-white/10 bg-transparent text-white/70 hover:bg-white/[0.06] hover:text-white"
                  >
                    {isShared ? (
                      <>
                        <Share2 />
                        Compartida con {coach.name}
                      </>
                    ) : (
                      <>
                        <LockKeyhole />
                        Privada
                      </>
                    )}
                  </Button>
                )}
                {hasChanges && (
                  <Button
                    onClick={save}
                    disabled={hasUnnamedExercises || hasInvalidDetails}
                    title={
                      hasUnnamedExercises
                        ? "Completá el nombre del ejercicio nuevo"
                        : hasInvalidDetails
                          ? "Completá el nombre de la rutina"
                          : undefined
                    }
                    className="rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-[0_10px_30px_rgba(79,70,229,.2)] hover:brightness-110"
                  >
                    <Check />
                    {hasUnnamedExercises
                      ? "Completá el ejercicio"
                      : hasInvalidDetails
                        ? "Completá el nombre"
                        : "Guardar cambios"}
                  </Button>
                )}
              </div>
            </div>

            <RoutineDetailsFields routine={rutina} onUpdate={setRutina} />
          </div>

          {coach && (
            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-sm leading-relaxed text-white/60">
              {isShared
                ? `${coach.name} puede revisar esta rutina, pero no editarla. El cambio se aplica al guardar.`
                : "Solo vos podés ver y editar esta rutina. Podés compartirla cuando quieras."}
            </div>
          )}

          {(hasUnnamedExercises || hasInvalidDetails) && (
            <div className="mt-4 rounded-2xl border border-amber-300/12 bg-amber-300/[0.06] px-4 py-3 text-sm leading-relaxed text-amber-100/80">
              {hasUnnamedExercises
                ? "Completá el nombre del ejercicio nuevo para guardar la rutina."
                : "Completá el nombre de la rutina para guardar los cambios."}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={moverEjercicio}
          >
            {rutina.structure.sections.map((section, index) => (
              <SeccionEditor
                key={section.id}
                section={section}
                index={index}
                abierto={openSectionId === section.id}
                onToggle={() =>
                  setOpenSectionId((current) =>
                    current === section.id ? null : section.id,
                  )
                }
                onKindChange={(kind) => updateSectionKind(section.id, kind)}
                addExercise={
                  <button
                    type="button"
                    onClick={() => agregarEjercicioVacio(section.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-200/15 bg-cyan-300/[0.025] px-4 py-3 text-xs text-cyan-100/55 transition-colors hover:border-cyan-200/30 hover:bg-cyan-300/[0.06] hover:text-cyan-100"
                  >
                    <Plus className="size-3.5" />
                    Sumar ejercicio
                  </button>
                }
              >
                {section.exercises.map((exercise) => (
                  <FilaEjercicio
                    key={exercise.id}
                    item={exercise}
                    sectionId={section.id}
                    onUpdate={(next) =>
                      actualizarEjercicio(section.id, exercise.id, next)
                    }
                    onDelete={() =>
                      eliminarEjercicio(section.id, exercise.id)
                    }
                  />
                ))}
              </SeccionEditor>
            ))}

            <div className="border-t border-white/[0.06] p-3">
              <DialogoEjercicio
                sections={rutina.structure.sections}
                initialSectionId="nuevo"
                trigger={
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-200/15 bg-violet-300/[0.025] px-4 py-3 text-xs text-violet-100/55 transition-colors hover:border-violet-200/30 hover:bg-violet-300/[0.06] hover:text-violet-100"
                  >
                    <Plus className="size-3.5" />
                    Crear sección
                  </button>
                }
                onAdd={agregarEjercicio}
              />
            </div>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}
