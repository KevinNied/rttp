"use client";

import { useState } from "react";
import { ArrowRight, GripVertical, Plus } from "lucide-react";

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
import { Routine, User } from "@/lib/rttp-data";

export function DialogoNuevaRutina({
  atleta,
  onCreate,
}: {
  atleta: User;
  onCreate: (rutina: Routine) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitulo] = useState("");
  const [objective, setObjetivo] = useState("");
  const [durationMinutes, setDuracion] = useState("");

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (siguiente) return;
    setTitulo("");
    setObjetivo("");
    setDuracion("");
  }

  function crear() {
    if (!title.trim()) return;

    const timestamp = Date.now();
    onCreate({
      id: `rutina-${atleta.id}-${timestamp}`,
      athleteId: atleta.id,
      title: title.trim(),
      objective: objective.trim() || "Entrenamiento personalizado",
      durationMinutes: durationMinutes.trim()
        ? Math.max(1, Number(durationMinutes))
        : null,
      structure: {
        sections: [
          {
            id: `seccion-${timestamp}`,
            name: "Sección 1",
            kind: "sequential",
            role: "custom",
            presentation: "standard",
            exercises: [],
          },
        ],
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="rounded-full border-indigo-200/10 bg-indigo-300/[0.05] text-white hover:bg-indigo-300/10 hover:text-white"
          />
        }
      >
        <Plus />
        Nueva rutina
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-app-panel text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear rutina para {atleta.name}</DialogTitle>
          <DialogDescription className="text-white/40">
            Empezá con una sección secuencial vacía y personalizala cuando
            quieras.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Nombre</span>
            <Input
              autoFocus
              value={title}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Ej. Potencia"
              className="border-white/10 bg-black/35"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Objetivo (opcional)</span>
            <Input
              value={objective}
              onChange={(event) => setObjetivo(event.target.value)}
              placeholder="Ej. Fuerza y estabilidad"
              className="border-white/10 bg-black/35"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs text-white/55">
              Duración estimada (minutos, opcional)
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={durationMinutes}
              onChange={(event) => setDuracion(event.target.value)}
              className="border-white/10 bg-black/35"
            />
          </label>
          <div className="rounded-2xl border border-dashed border-cyan-200/15 bg-cyan-300/[0.04] p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                <GripVertical className="size-4" />
              </div>
              <div>
                <div className="text-xs text-white/75">
                  Constructor flexible
                </div>
                <div className="mt-1 text-[10px] leading-relaxed text-white/35">
                  Mové ejercicios dentro de una sección o arrastralos hacia
                  otra.
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button variant="ghost" className="text-white/45" />}
            >
              Cancelar
            </DialogClose>
            <DialogClose
              render={
                <Button
                  type="button"
                  onClick={crear}
                  disabled={!title.trim()}
                  className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
                />
              }
            >
              Crear y editar
              <ArrowRight />
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
