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
import { Routine } from "@/lib/rttp-data";

export function DialogoDetallesRutina({
  rutina,
  onUpdate,
}: {
  rutina: Routine;
  onUpdate: (rutina: Routine) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitulo] = useState(rutina.title);
  const [objective, setObjetivo] = useState(rutina.objective);
  const [durationMinutes, setDuracion] = useState(
    String(rutina.durationMinutes ?? ""),
  );

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (!siguiente) return;
    setTitulo(rutina.title);
    setObjetivo(
      rutina.objective === "Entrenamiento personalizado"
        ? ""
        : rutina.objective,
    );
    setDuracion(String(rutina.durationMinutes ?? ""));
  }

  function guardar() {
    if (!title.trim()) return;
    onUpdate({
      ...rutina,
      title: title.trim(),
      objective: objective.trim() || "Entrenamiento personalizado",
      durationMinutes: durationMinutes.trim()
        ? Math.max(1, Number(durationMinutes))
        : null,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-white/10 bg-transparent text-white/65 hover:bg-white/[0.06] hover:text-white"
          />
        }
      >
        Editar detalles
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-app-panel text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalles de la rutina</DialogTitle>
          <DialogDescription className="text-white/40">
            El nombre es obligatorio. Los demás campos son opcionales.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Nombre</span>
            <Input
              autoFocus
              value={title}
              onChange={(event) => setTitulo(event.target.value)}
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
        </div>
        <DialogFooter>
          <DialogClose
            render={<Button variant="ghost" className="text-white/45" />}
          >
            Cancelar
          </DialogClose>
          <Button
            type="button"
            onClick={guardar}
            disabled={!title.trim()}
            className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
          >
            Guardar detalles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
