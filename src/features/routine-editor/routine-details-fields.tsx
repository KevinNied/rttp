"use client";

import { Input } from "@/components/ui/input";
import { Routine } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

export function RoutineDetailsFields({
  routine,
  onUpdate,
  compact = false,
}: {
  routine: Routine;
  onUpdate: (routine: Routine) => void;
  compact?: boolean;
}) {
  const missingTitle = !routine.title.trim();

  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2",
        compact
          ? "2xl:grid-cols-[minmax(15rem,1.3fr)_minmax(15rem,1fr)_9rem]"
          : "xl:grid-cols-[minmax(15rem,1.3fr)_minmax(15rem,1fr)_9rem]",
      )}
    >
      <label
        className={cn(
          "block min-w-0 space-y-1.5 md:col-span-2",
          compact ? "2xl:col-span-1" : "xl:col-span-1",
        )}
      >
        <span className="text-xs font-medium text-white/65">
          Nombre de la rutina
        </span>
        <Input
          value={routine.title}
          onChange={(event) =>
            onUpdate({ ...routine, title: event.target.value })
          }
          onBlur={(event) =>
            onUpdate({ ...routine, title: event.currentTarget.value.trim() })
          }
          aria-invalid={missingTitle}
          placeholder="Nueva rutina"
          className="h-11 border-white/10 bg-black/20 px-3 text-lg font-medium text-white placeholder:text-white/30 md:text-lg"
        />
        {missingTitle && (
          <span className="block text-xs text-amber-100/80">
            El nombre es obligatorio.
          </span>
        )}
      </label>

      <label className="block min-w-0 space-y-1.5">
        <span className="text-xs font-medium text-white/65">
          Objetivo
          <span className="ml-1 font-normal text-white/45">(opcional)</span>
        </span>
        <Input
          value={
            routine.objective === "Entrenamiento personalizado"
              ? ""
              : routine.objective
          }
          onChange={(event) =>
            onUpdate({ ...routine, objective: event.target.value })
          }
          onBlur={(event) =>
            onUpdate({
              ...routine,
              objective:
                event.currentTarget.value.trim() ||
                "Entrenamiento personalizado",
            })
          }
          placeholder="Ej. Fuerza y estabilidad"
          className="h-11 border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-white/30 md:text-sm"
        />
      </label>

      <label className="block min-w-0 space-y-1.5">
        <span className="text-xs font-medium text-white/65">
          Duración
          <span className="ml-1 font-normal text-white/45">(min)</span>
        </span>
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          value={routine.durationMinutes ?? ""}
          onChange={(event) => {
            const duration = event.target.valueAsNumber;
            onUpdate({
              ...routine,
              durationMinutes:
                event.target.value && Number.isFinite(duration)
                  ? Math.max(1, duration)
                  : null,
            });
          }}
          placeholder="Sin estimar"
          className="h-11 border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-white/30 md:text-sm"
        />
      </label>
    </div>
  );
}
