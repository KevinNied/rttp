"use client";

import { useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Exercise, RoutineSection, SectionKind } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

export function DialogoEjercicio({
  sections,
  trigger,
  initialSectionId,
  onAdd,
}: {
  sections: RoutineSection[];
  trigger: React.ReactElement;
  initialSectionId: string;
  onAdd: (
    item: Exercise,
    sectionId: string,
    newSectionName?: string,
    newSectionKind?: SectionKind,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setNombre] = useState("");
  const [sets, setSeries] = useState("3");
  const [modoRepeticiones, setModoRepeticiones] = useState<"fijas" | "rango">(
    "fijas",
  );
  const [reps, setRepeticiones] = useState("10");
  const [minReps, setRepeticionesMin] = useState("10");
  const [maxReps, setRepeticionesMax] = useState("10");
  const [weight, setPeso] = useState("0");
  const [restSeconds, setDescanso] = useState("");
  const [instructions, setAclaraciones] = useState("");
  const [sectionId, setSectionId] = useState(initialSectionId);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionKind, setNewSectionKind] =
    useState<SectionKind>("sequential");

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (siguiente) return;
    setNombre("");
    setSeries("3");
    setModoRepeticiones("fijas");
    setRepeticiones("10");
    setRepeticionesMin("10");
    setRepeticionesMax("10");
    setPeso("0");
    setDescanso("");
    setAclaraciones("");
    setSectionId(initialSectionId);
    setNewSectionName("");
    setNewSectionKind("sequential");
  }

  function agregar() {
    if (!name.trim()) return;
    onAdd(
      {
        id: `${name.toLowerCase().replace(/\W+/g, "-")}-${Date.now()}`,
        name: name.trim(),
        sets: Math.max(1, Number(sets) || 1),
        minReps: Math.max(
          0,
          Number(modoRepeticiones === "fijas" ? reps : minReps) || 0,
        ),
        maxReps:
          modoRepeticiones === "fijas"
            ? Math.max(0, Number(reps) || 0)
            : Math.max(Number(minReps) || 0, Number(maxReps) || 0),
        weight: Math.max(0, Number(weight) || 0),
        restSeconds:
          restSeconds.trim() === "" ? null : Math.max(0, Number(restSeconds)),
        instructions: instructions.trim(),
      },
      sectionId,
      newSectionName.trim() || `Sección ${sections.length + 1}`,
      newSectionKind,
    );
    cambiarApertura(false);
  }

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger render={trigger} />
      <DialogContent className="border-violet-200/15 bg-app-panel text-white">
        <DialogHeader>
          <DialogTitle>
            {initialSectionId === "nuevo" ? "Nueva sección" : "Nuevo ejercicio"}
          </DialogTitle>
          <DialogDescription className="text-indigo-100/45">
            {initialSectionId === "nuevo"
              ? "Elegí cómo se ejecutará la sección y agregá su primer ejercicio."
              : `Se agregará a ${sections.find((section) => section.id === initialSectionId)?.name ?? "esta sección"}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <label className="space-y-2">
            <span className="text-xs text-indigo-100/55">Nombre</span>
            <Input
              value={name}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Peso muerto"
              className="border-white/10 bg-black/35"
            />
          </label>
          {sectionId === "nuevo" && (
            <label className="block space-y-2">
              <span className="text-xs text-indigo-100/55">
                Nombre de la nueva sección (opcional)
              </span>
              <Input
                value={newSectionName}
                onChange={(event) => setNewSectionName(event.target.value)}
                placeholder={`Sección ${sections.length + 1}`}
                className="border-white/10 bg-black/35"
              />
            </label>
          )}
          {sectionId === "nuevo" && (
            <div className="space-y-2">
              <div className="text-xs text-indigo-100/55">
                Tipo de ejecución
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    kind: "sequential" as const,
                    title: "Secuencial",
                    description:
                      "Todas las series de un ejercicio antes del siguiente.",
                  },
                  {
                    kind: "rounds" as const,
                    title: "Por rondas",
                    description: "Alterna los ejercicios en cada vuelta.",
                  },
                ].map((option) => (
                  <button
                    key={option.kind}
                    type="button"
                    onClick={() => setNewSectionKind(option.kind)}
                    className={cn(
                      "rounded-2xl border p-3 text-left transition-colors",
                      newSectionKind === option.kind
                        ? "border-cyan-200/30 bg-cyan-300/[0.09]"
                        : "border-white/[0.08] bg-black/20 hover:bg-white/[0.04]",
                    )}
                  >
                    <div className="text-xs font-medium text-white">
                      {option.title}
                    </div>
                    <div className="mt-1 text-[10px] leading-relaxed text-white/45">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ["Series", sets, setSeries],
              ["Peso", weight, setPeso],
              ["Descanso", restSeconds, setDescanso],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="space-y-2">
                <span className="text-xs text-indigo-100/55">
                  {label as string}
                </span>
                <Input
                  type="number"
                  inputMode={
                    (label as string).startsWith("Peso") ? "decimal" : "numeric"
                  }
                  min={0}
                  step={(label as string).startsWith("Peso") ? "0.5" : "1"}
                  placeholder={
                    (label as string).startsWith("Descanso") ? "Opcional" : ""
                  }
                  value={value as string}
                  onChange={(event) =>
                    (setter as React.Dispatch<React.SetStateAction<string>>)(
                      event.target.value,
                    )
                  }
                  className="border-white/10 bg-black/35"
                />
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <span className="text-xs text-indigo-100/55">Repeticiones</span>
            <div className="flex rounded-xl border border-white/10 bg-black/20 p-1 text-xs">
              {[
                ["fijas", "Número fijo"],
                ["rango", "Mínimo y máximo"],
              ].map(([modo, etiqueta]) => (
                <button
                  key={modo}
                  type="button"
                  onClick={() => setModoRepeticiones(modo as "fijas" | "rango")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 transition-colors",
                    modoRepeticiones === modo
                      ? "bg-cyan-300 text-indigo-950"
                      : "text-white/45 hover:text-white",
                  )}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
            {modoRepeticiones === "fijas" ? (
              <label className="block space-y-2">
                <span className="text-xs text-indigo-100/55">Repeticiones</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={reps}
                  onChange={(event) => setRepeticiones(event.target.value)}
                  className="border-white/10 bg-black/35"
                />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-2">
                  <span className="text-xs text-indigo-100/55">Mínimas</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={minReps}
                    onChange={(event) => setRepeticionesMin(event.target.value)}
                    className="border-white/10 bg-black/35"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs text-indigo-100/55">Máximas</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={Number(minReps) || 0}
                    value={maxReps}
                    onChange={(event) => setRepeticionesMax(event.target.value)}
                    className="border-white/10 bg-black/35"
                  />
                </label>
              </div>
            )}
          </div>
          <label className="block space-y-2">
            <span className="text-xs text-indigo-100/55">Aclaraciones</span>
            <Input
              value={instructions}
              onChange={(event) => setAclaraciones(event.target.value)}
              placeholder="Ej. Con barra · cada lado"
              className="border-white/10 bg-black/35"
            />
          </label>
        </div>
        <DialogFooter>
          <DialogClose
            render={<Button variant="ghost" className="text-indigo-100/50" />}
          >
            Cancelar
          </DialogClose>
          <Button
            onClick={agregar}
            disabled={!name.trim()}
            className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
          >
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
