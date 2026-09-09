"use client";

import { Routine } from "@/lib/rttp-data";
import { countLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

import { cantidadEjercicios } from "@/domain/routine/routine-metrics";

export function SelectorRutina({
  routines,
  rutinaActiva,
  onSelect,
  authorLabel,
  desktopVertical = false,
}: {
  routines: Routine[];
  rutinaActiva?: Routine;
  onSelect: (id: string) => void;
  authorLabel?: (routine: Routine) => string;
  desktopVertical?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2",
        desktopVertical && "xl:grid-cols-1 xl:gap-3",
      )}
    >
      {routines.map((rutina, index) => (
        <button
          key={rutina.id}
          onClick={() => onSelect(rutina.id)}
          className={cn(
            "rounded-2xl border p-3 text-left transition-all",
            desktopVertical && "xl:p-4",
            rutina.id === rutinaActiva?.id
              ? index % 2 === 0
                ? "border-blue-300/35 bg-blue-400/[0.10]"
                : "border-violet-300/35 bg-violet-400/[0.10]"
              : "border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.06]",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div
              className={cn(
                "truncate text-sm font-medium",
                desktopVertical && "xl:text-base",
              )}
            >
              {rutina.title}
            </div>
            {cantidadEjercicios(rutina) === 0 && (
              <span className="shrink-0 rounded-full border border-amber-300/15 bg-amber-300/10 px-2 py-0.5 text-[9px] text-amber-100/80">
                Vacía
              </span>
            )}
          </div>
          <div
            className={cn(
              "mt-1 text-[10px] text-indigo-100/35",
              desktopVertical && "xl:mt-2 xl:text-xs",
            )}
          >
            {countLabel(cantidadEjercicios(rutina), "ejercicio")}
          </div>
          {authorLabel && (
            <div className="mt-1 truncate text-[9px] text-cyan-100/45">
              {authorLabel(rutina)}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
