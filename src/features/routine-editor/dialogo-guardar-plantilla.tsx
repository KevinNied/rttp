"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

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
import { countLabel } from "@/lib/format";
import { Routine } from "@/lib/rttp-data";

import { cantidadEjercicios } from "@/domain/routine/routine-metrics";

export function DialogoGuardarPlantilla({
  rutina,
  onSave,
}: {
  rutina: Routine;
  onSave: (title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(rutina.title);
  const exercises = cantidadEjercicios(rutina);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setTitle(rutina.title);
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            disabled={exercises === 0}
            title={
              exercises === 0
                ? "Agregá al menos un ejercicio antes de guardarla como plantilla"
                : `Guardar ${rutina.title} como plantilla`
            }
            className="self-start shrink-0 rounded-full border-indigo-200/10 bg-indigo-300/[0.05] text-white hover:bg-indigo-300/10 hover:text-white xl:self-auto"
          />
        }
      >
        <Plus />
        Guardar como plantilla
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-app-panel text-white">
        <DialogHeader>
          <DialogTitle>Guardar plantilla</DialogTitle>
          <DialogDescription className="text-white/50">
            Vas a crear una copia reutilizable de “{rutina.title}” con{" "}
            {countLabel(exercises, "ejercicio")}.
          </DialogDescription>
        </DialogHeader>
        <label className="block space-y-2">
          <span className="text-xs text-white/65">Nombre de la plantilla</span>
          <Input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Fuerza base"
            className="h-11 border-white/10 bg-black/25"
          />
        </label>
        <DialogFooter>
          <DialogClose
            render={<Button variant="ghost" className="text-white/55" />}
          >
            Cancelar
          </DialogClose>
          <Button
            disabled={!title.trim()}
            onClick={() => {
              onSave(title.trim());
              setOpen(false);
            }}
            className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
          >
            Crear plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
