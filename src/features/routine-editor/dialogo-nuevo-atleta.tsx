"use client";

import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";

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
import { User } from "@/lib/rttp-data";

export function DialogoNuevoAtleta({
  users,
  onCreate,
}: {
  users: User[];
  onCreate: (name: string, email: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false);

  function cambiarApertura(siguiente: boolean) {
    if (!siguiente && creando) return;
    setOpen(siguiente);
    if (siguiente) return;
    setNombre("");
    setEmail("");
    setError("");
  }

  async function crear() {
    const emailNormalizado = email.trim().toLowerCase();
    if (users.some((item) => item.email.toLowerCase() === emailNormalizado)) {
      setError("Ya existe un usuario con ese email.");
      return;
    }
    setCreando(true);
    const errorCreacion = await onCreate(name.trim(), emailNormalizado);
    setCreando(false);
    if (errorCreacion) {
      setError(errorCreacion);
      return;
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger
        render={
          <button
            aria-label="Agregar alumno"
            title="Agregar alumno"
            className="grid size-10 place-items-center rounded-full border border-dashed border-white/10 text-white/35 transition-colors hover:border-cyan-200/25 hover:bg-cyan-300/[0.07] hover:text-cyan-100"
          />
        }
      >
        <Plus className="size-4" />
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-app-panel text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar alumno</DialogTitle>
          <DialogDescription className="text-white/40">
            Podrá ingresar a RTTP usando este email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Nombre</span>
            <Input
              autoFocus
              value={name}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Juan"
              className="border-white/10 bg-black/35"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs text-white/55">Email</span>
            <Input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              placeholder="juan@email.com"
              className="border-white/10 bg-black/35"
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-red-300">
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose
              render={<Button variant="ghost" className="text-white/45" />}
            >
              Cancelar
            </DialogClose>
            <Button
              type="button"
              onClick={crear}
              disabled={!name.trim() || !email.trim() || creando}
              className="bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
            >
              {creando ? "Guardando..." : "Agregar alumno"}
              <ArrowRight />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
