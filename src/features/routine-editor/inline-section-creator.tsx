"use client";

import { Check, Plus, X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { SectionKind } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

export function InlineSectionCreator({
  onCreate,
}: {
  onCreate: (name: string, kind: SectionKind) => string;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<SectionKind>("sequential");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pendingFocusRef = useRef<"trigger" | string | null>(null);

  useEffect(() => {
    if (isCreating || !pendingFocusRef.current) return;
    const target =
      pendingFocusRef.current === "trigger"
        ? triggerRef.current
        : document.getElementById(
            `section-toggle-${pendingFocusRef.current}`,
          );
    target?.focus();
    pendingFocusRef.current = null;
  }, [isCreating]);

  function reset() {
    setName("");
    setKind("sequential");
    setIsCreating(false);
  }

  function cancel() {
    pendingFocusRef.current = "trigger";
    reset();
  }

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) return;
    const sectionId = onCreate(normalizedName, kind);
    pendingFocusRef.current = sectionId;
    reset();
  }

  if (!isCreating) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsCreating(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-app-surface px-4 py-3 text-xs font-medium text-foreground/65 transition-colors hover:border-primary/35 hover:bg-app-elevated hover:text-foreground dark:border-violet-200/15 dark:bg-violet-300/[0.025] dark:text-violet-100/55 dark:hover:border-violet-200/30 dark:hover:bg-violet-300/[0.06] dark:hover:text-violet-100"
      >
        <Plus className="size-3.5" />
        Crear sección
      </button>
    );
  }

  return (
    <form
      onSubmit={create}
      className="rounded-2xl border border-border bg-app-surface p-3 shadow-sm dark:border-violet-200/15 dark:bg-violet-300/[0.025] dark:shadow-none"
    >
      <Input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nombre de la sección"
        aria-label="Nombre de la nueva sección"
        className="h-11 border-border bg-app-panel text-base dark:border-white/10 dark:bg-black/20"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["sequential", "rounds"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={kind === option}
            onClick={() => setKind(option)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-left transition-colors",
              kind === option
                ? "border-primary/30 bg-app-elevated text-foreground dark:border-cyan-200/25 dark:bg-cyan-300/[0.08] dark:text-cyan-50"
                : "border-border bg-app-panel text-foreground/60 hover:bg-app-elevated hover:text-foreground dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-white/40 dark:hover:text-white/70",
            )}
          >
            <span className="block text-sm font-medium">
              {option === "sequential" ? "Secuencial" : "Por rondas"}
            </span>
            <span className="mt-1 block text-xs text-current opacity-75">
              {option === "sequential"
                ? "Ejercicio por ejercicio"
                : "Alternar en cada vuelta"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={cancel}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-foreground/60 transition-colors hover:bg-app-elevated hover:text-foreground dark:text-white/45 dark:hover:bg-white/[0.05] dark:hover:text-white"
        >
          <X className="size-3.5" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Check className="size-3.5" />
          Crear sección
        </button>
      </div>
    </form>
  );
}
