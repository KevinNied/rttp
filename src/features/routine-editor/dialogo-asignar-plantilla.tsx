"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

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
import { User } from "@/lib/rttp-data";

import { RoutineTemplate } from "@/domain/routine/routine-factory";

export function DialogoAsignarPlantilla({
  plantilla,
  atletas,
  onAssign,
}: {
  plantilla: RoutineTemplate;
  atletas: User[];
  onAssign: (athleteId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [athleteId, setAtletaId] = useState(String(atletas[0]?.id ?? ""));

  function cambiarApertura(siguiente: boolean) {
    setOpen(siguiente);
    if (siguiente) setAtletaId(String(atletas[0]?.id ?? ""));
  }

  function asignar() {
    const id = Number(athleteId);
    if (!id) return;
    onAssign(id);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
          />
        }
      >
        Asignar
        <ArrowRight />
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-app-panel text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Asignar “{plantilla.title}”</DialogTitle>
          <DialogDescription className="text-white/40">
            Se creará una copia independiente para el atleta, lista para
            personalizar pesos y detalles.
          </DialogDescription>
        </DialogHeader>
        <label className="block space-y-2">
          <span className="text-xs text-white/55">Atleta</span>
          <select
            value={athleteId}
            onChange={(event) => setAtletaId(event.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none focus:border-cyan-300/40"
          >
            {atletas.map((atleta) => (
              <option key={atleta.id} value={atleta.id}>
                {atleta.name}
              </option>
            ))}
          </select>
        </label>
        <DialogFooter>
          <DialogClose
            render={<Button variant="ghost" className="text-white/45" />}
          >
            Cancelar
          </DialogClose>
          <Button
            type="button"
            onClick={asignar}
            disabled={!athleteId}
            className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
          >
            Asignar rutina
            <ArrowRight />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
