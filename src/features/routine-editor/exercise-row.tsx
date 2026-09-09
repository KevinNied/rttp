"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Minus, Plus, X } from "lucide-react";
import { useState } from "react";

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
  const [restUnit, setRestUnit] = useState<"seconds" | "minutes">(() =>
    item.restSeconds !== null &&
    item.restSeconds >= 60 &&
    item.restSeconds % 60 === 0
      ? "minutes"
      : "seconds",
  );
  const restValue =
    item.restSeconds === null
      ? ""
      : restUnit === "minutes"
        ? item.restSeconds / 60
        : item.restSeconds;

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
        <div className="w-24 text-center">
          <div className="flex h-8 items-center rounded-lg border border-white/10 bg-black/25">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                onUpdate({ ...item, sets: Math.max(1, item.sets - 1) })
              }
              className="rounded-lg text-indigo-100/50 hover:bg-indigo-300/10 hover:text-white"
              aria-label={`Quitar una serie de ${exerciseLabel}`}
            >
              <Minus />
            </Button>
            <div className="min-w-0 flex-1 text-center text-xs tabular-nums">
              {item.sets}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onUpdate({ ...item, sets: item.sets + 1 })}
              className="rounded-lg text-indigo-100/50 hover:bg-indigo-300/10 hover:text-white"
              aria-label={`Agregar una serie a ${exerciseLabel}`}
            >
              <Plus />
            </Button>
          </div>
          <div className="mt-1 text-xs uppercase text-indigo-100/55">
            series
          </div>
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
        <label className="w-32 text-center">
          <div className="flex h-8 overflow-hidden rounded-lg border border-white/10 bg-black/25">
            <Input
              type="number"
              inputMode={restUnit === "minutes" ? "decimal" : "numeric"}
              min={0}
              step={restUnit === "minutes" ? "0.5" : "5"}
              placeholder="—"
              value={restValue}
              onChange={(event) => {
                if (event.target.value === "") {
                  onUpdate({ ...item, restSeconds: null });
                  return;
                }
                const value = Math.max(0, Number(event.target.value));
                onUpdate({
                  ...item,
                  restSeconds: Math.round(
                    restUnit === "minutes" ? value * 60 : value,
                  ),
                });
              }}
              aria-label={`Descanso de ${exerciseLabel}`}
              className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 text-center text-xs tabular-nums shadow-none focus-visible:ring-0 dark:bg-transparent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <div
              role="group"
              aria-label={`Unidad de descanso de ${exerciseLabel}`}
              className="grid w-16 shrink-0 grid-cols-2 border-l border-white/10 p-0.5"
            >
              {(["seconds", "minutes"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  aria-label={
                    unit === "seconds"
                      ? "Usar segundos para el descanso"
                      : "Usar minutos para el descanso"
                  }
                  aria-pressed={restUnit === unit}
                  onClick={() => setRestUnit(unit)}
                  className={cn(
                    "rounded text-[10px] transition-colors",
                    restUnit === unit
                      ? "bg-white/10 text-white"
                      : "text-white/45 hover:text-white/75",
                  )}
                >
                  {unit === "seconds" ? "s" : "min"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1 text-xs uppercase text-indigo-100/55">
            descanso
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
