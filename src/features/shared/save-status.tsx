import { Check, CloudOff, LoaderCircle, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

import { SyncState } from "@/application/sync/sync-state";

export function SaveStatus({
  dirty,
  syncState,
  className,
}: {
  dirty: boolean;
  syncState: SyncState;
  className?: string;
}) {
  const state = dirty
    ? {
        label: "Cambios sin guardar",
        Icon: TriangleAlert,
        className: "text-warning",
      }
    : syncState === "saving"
      ? {
          label: "Guardando…",
          Icon: LoaderCircle,
          className: "text-info",
        }
      : syncState === "pending"
        ? {
            label: "Guardado en este dispositivo · Pendiente de sincronización",
            Icon: CloudOff,
            className: "text-warning",
          }
        : syncState === "error" || syncState === "unavailable"
          ? {
              label: "No pudimos sincronizar los cambios",
              Icon: TriangleAlert,
              className: "text-destructive",
            }
          : {
              label: "Sincronizado",
              Icon: Check,
              className: "text-success",
            };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-xs",
        state.className,
        className,
      )}
    >
      <state.Icon
        className={cn(
          "size-3.5 shrink-0",
          syncState === "saving" && !dirty && "animate-spin",
        )}
      />
      <span>{state.label}</span>
    </div>
  );
}

