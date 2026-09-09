"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Minus, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Exercise } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

export function FilaEjercicio({
  item,
  sectionId,
  onUpdate,
  onDelete,
}: {
  item: Exercise;
  sectionId: string;
  onUpdate: (item: Exercise) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { sectionId } });
  const exerciseLabel = item.name.trim() || "nuevo ejercicio";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "mx-3 my-2 grid gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-3 py-3 shadow-sm xl:mx-4 xl:my-3 xl:grid-cols-[minmax(10rem,1fr)_auto] xl:items-center xl:gap-5 xl:px-4 xl:py-4",
        isDragging &&
          "relative z-20 border-cyan-300/30 bg-app-elevated opacity-70 shadow-2xl",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Arrastrar ${exerciseLabel}`}
          className="touch-none cursor-grab rounded-lg p-1 text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/55 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <Input
            id={`exercise-name-${item.id}`}
            value={item.name}
            onChange={(event) =>
              onUpdate({ ...item, name: event.target.value })
            }
            onBlur={() => {
              const trimmedName = item.name.trim();
              if (trimmedName !== item.name) {
                onUpdate({ ...item, name: trimmedName });
              }
            }}
            autoFocus={!item.name}
            aria-label={
              item.name ? `Nombre de ${item.name}` : "Nombre del nuevo ejercicio"
            }
            placeholder="Nombre del ejercicio"
            className="h-6 rounded-none border-0 bg-transparent p-0 text-sm font-medium shadow-none placeholder:text-white/25 focus-visible:ring-0 dark:bg-transparent xl:text-base"
          />
          <Input
            value={item.instructions}
            onChange={(event) =>
              onUpdate({ ...item, instructions: event.target.value })
            }
            aria-label={`Aclaraciones de ${exerciseLabel}`}
            placeholder="+ Aclaración opcional"
            className="mt-1 h-7 rounded-none border-0 bg-transparent p-0 text-xs text-violet-100/70 shadow-none placeholder:text-white/45 focus-visible:ring-0 dark:bg-transparent xl:text-sm"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 sm:justify-start xl:justify-end">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              onUpdate({ ...item, sets: Math.max(1, item.sets - 1) })
            }
            className="rounded-full text-indigo-100/40 hover:bg-indigo-300/10 hover:text-white"
            aria-label={`Quitar una serie de ${exerciseLabel}`}
          >
            <Minus />
          </Button>
          <div className="w-10 text-center">
            <div className="text-sm">{item.sets}</div>
            <div className="text-xs uppercase text-indigo-100/55">
              series
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onUpdate({ ...item, sets: item.sets + 1 })}
            className="rounded-full text-indigo-100/40 hover:bg-indigo-300/10 hover:text-white"
            aria-label={`Agregar una serie a ${exerciseLabel}`}
          >
            <Plus />
          </Button>
        </div>
        <div className="space-y-1">
          <div
            role="group"
            aria-label={`Tipo de repeticiones de ${exerciseLabel}`}
            className="grid h-8 w-32 grid-cols-2 rounded-lg border border-white/10 bg-black/25 p-0.5"
          >
            {(["fijas", "rango"] as const).map((tipo) => {
              const seleccionado =
                tipo === "fijas"
                  ? item.minReps === item.maxReps
                  : item.minReps !== item.maxReps;
              return (
                <button
                  key={tipo}
                  type="button"
                  aria-pressed={seleccionado}
                  onClick={() => {
                    if (tipo === "fijas") {
                      onUpdate({
                        ...item,
                        maxReps: item.minReps,
                      });
                      return;
                    }
                    onUpdate({
                      ...item,
                      maxReps: Math.max(item.minReps + 1, item.maxReps),
                    });
                  }}
                  className={cn(
                    "rounded-md text-xs transition-colors",
                    seleccionado
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-white/60 hover:text-white/80",
                  )}
                >
                  {tipo === "fijas" ? "Fijas" : "Rango"}
                </button>
              );
            })}
          </div>
          {item.minReps === item.maxReps ? (
            <label className="block w-32 text-center">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={item.minReps}
                onChange={(event) => {
                  const reps = Math.max(0, Number(event.target.value));
                  onUpdate({
                    ...item,
                    minReps: reps,
                    maxReps: reps,
                  });
                }}
                aria-label={`Repeticiones de ${exerciseLabel}`}
                className="h-8 border-white/10 bg-black/25 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div className="mt-1 text-xs uppercase text-indigo-100/55">
                reps.
              </div>
            </label>
          ) : (
            <div className="flex gap-1">
              <label className="w-16 text-center">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={item.minReps}
                  onChange={(event) =>
                    onUpdate({
                      ...item,
                      minReps: Math.min(
                        item.maxReps,
                        Math.max(0, Number(event.target.value)),
                      ),
                    })
                  }
                  aria-label={`Repeticiones mínimas de ${exerciseLabel}`}
                  className="h-8 border-white/10 bg-black/25 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <div className="mt-1 text-xs uppercase text-indigo-100/55">
                  mín.
                </div>
              </label>
              <label className="w-16 text-center">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={item.minReps}
                  value={item.maxReps}
                  onChange={(event) =>
                    onUpdate({
                      ...item,
                      maxReps: Math.max(
                        item.minReps,
                        Number(event.target.value),
                      ),
                    })
                  }
                  aria-label={`Repeticiones máximas de ${exerciseLabel}`}
                  className="h-8 border-white/10 bg-black/25 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <div className="mt-1 text-xs uppercase text-indigo-100/55">
                  máx.
                </div>
              </label>
            </div>
          )}
        </div>
        <label className="w-20 text-center">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.5"
            value={item.weight}
            onChange={(event) =>
              onUpdate({
                ...item,
                weight: Math.max(0, Number(event.target.value)),
              })
            }
            aria-label={`Peso de ${exerciseLabel}`}
            className="h-8 border-white/10 bg-black/25 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <div className="mt-1 text-xs uppercase text-indigo-100/55">
            peso (kg)
          </div>
        </label>
        <label className="w-20 text-center">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="—"
            value={item.restSeconds ?? ""}
            onChange={(event) =>
              onUpdate({
                ...item,
                restSeconds:
                  event.target.value === ""
                    ? null
                    : Math.max(0, Number(event.target.value)),
              })
            }
            aria-label={`Descanso de ${exerciseLabel}`}
            className="h-8 border-white/10 bg-black/25 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <div className="mt-1 text-xs uppercase text-indigo-100/55">
            descanso (s)
          </div>
        </label>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          className="hidden text-indigo-100/20 hover:bg-red-400/10 hover:text-red-200 md:inline-flex"
          aria-label={`Eliminar ${exerciseLabel}`}
        >
          <X />
        </Button>
      </div>
    </div>
  );
}
