"use client";

import {
  Dumbbell,
  Hash,
  LayoutGrid,
  MessageSquarePlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { WorkoutAnnotation } from "@/lib/rttp-activity";

import { RoutineStep } from "@/domain/routine/routine-steps";

export type WorkoutAnnotationScope = WorkoutAnnotation["scope"];

function appliesToStep(annotation: WorkoutAnnotation, step: RoutineStep) {
  if (annotation.scope === "set") return annotation.stepId === step.stepId;
  if (annotation.scope === "exercise") {
    return (
      annotation.exerciseId === step.id &&
      annotation.sectionId === step.sectionId
    );
  }
  return annotation.sectionId === step.sectionId;
}

function annotationScopeLabel(annotation: WorkoutAnnotation) {
  if (annotation.scope === "set") return `Serie ${annotation.iteration}`;
  if (annotation.scope === "exercise") return "Ejercicio";
  return "Bloque";
}

export function WorkoutAnnotationSheet({
  step,
  annotations,
  onAdd,
  onUpdate,
  onDelete,
}: {
  step: RoutineStep;
  annotations: WorkoutAnnotation[];
  onAdd: (scope: WorkoutAnnotationScope, text: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const applicableAnnotations = annotations.filter((annotation) =>
    appliesToStep(annotation, step),
  );
  const editingAnnotation = applicableAnnotations.find(
    (annotation) => annotation.id === editingId,
  );
  const normalizedText = text.trim();
  const options = [
    {
      scope: "set" as const,
      icon: Hash,
      title: "Guardar en esta serie",
      description: `Solo para la serie ${step.round} de ${step.name}.`,
    },
    {
      scope: "exercise" as const,
      icon: Dumbbell,
      title: "Guardar en el ejercicio",
      description: "Aplica al ejercicio completo dentro de esta sesión.",
    },
    {
      scope: "block" as const,
      icon: LayoutGrid,
      title: "Guardar en el bloque",
      description: "Describe una adaptación que afecta a todo el bloque.",
    },
  ];

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setText("");
          setEditingId(null);
        }
      }}
    >
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full border border-white/10 bg-white/[0.035] text-content-muted hover:bg-white/[0.08] hover:text-white"
            aria-label="Agregar aclaración"
          />
        }
      >
        <MessageSquarePlus />
        {applicableAnnotations.length > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-cyan-300 px-1 text-[8px] font-bold leading-4 text-indigo-950">
            {applicableAnnotations.length}
          </span>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[88dvh] max-w-lg overflow-y-auto rounded-t-[2rem] border-white/10 bg-app-panel pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white"
      >
        <SheetHeader className="px-5 pt-6">
          <SheetTitle className="text-white">Agregar aclaración</SheetTitle>
          <SheetDescription className="text-white/60">
            Registrá una adaptación o detalle de cómo hiciste el entrenamiento.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          {applicableAnnotations.length > 0 && (
            <div className="space-y-2">
              <div className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-content-muted">
                Aclaraciones actuales
              </div>
              {applicableAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="flex items-start gap-3 rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.05] p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-100/55">
                      {annotationScopeLabel(annotation)}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-white/75">
                      {annotation.text}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(annotation.id);
                        setText(annotation.text);
                      }}
                      aria-label="Editar aclaración"
                      className="grid size-8 place-items-center rounded-full text-content-muted transition-colors hover:bg-white/[0.07] hover:text-white"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(annotation.id);
                        if (editingId === annotation.id) {
                          setEditingId(null);
                          setText("");
                        }
                      }}
                      aria-label="Eliminar aclaración"
                      className="grid size-8 place-items-center rounded-full text-content-muted transition-colors hover:bg-red-300/10 hover:text-red-200"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={500}
            placeholder="Ej. Bajé el peso para cuidar la técnica."
            aria-label="Texto de la aclaración"
            className="min-h-24 resize-none border-white/10 bg-black/25 text-sm"
          />

          {editingAnnotation ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setText("");
                }}
                className="h-11 flex-1 rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!normalizedText}
                onClick={() => {
                  onUpdate(editingAnnotation.id, normalizedText);
                  setOpen(false);
                  setEditingId(null);
                  setText("");
                }}
                className="h-11 flex-1 rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
              >
                Guardar cambios
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {options.map((option) => (
                <button
                  key={option.scope}
                  type="button"
                  disabled={!normalizedText}
                  onClick={() => {
                    onAdd(option.scope, normalizedText);
                    setOpen(false);
                    setText("");
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-violet-300/10 text-violet-200">
                    <option.icon className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm text-white">{option.title}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-white/60">
                      {option.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
