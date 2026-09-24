"use client";

import { useRef, useState } from "react";
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
  triggerLabel = "Agregar alumno",
}: {
  users: User[];
  onCreate: (name: string, email: string) => Promise<string | null>;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const errorId = "new-athlete-email-error";

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
      requestAnimationFrame(() => emailRef.current?.focus());
      return;
    }
    setCreando(true);
    const errorCreacion = await onCreate(name.trim(), emailNormalizado);
    setCreando(false);
    if (errorCreacion) {
      setError(errorCreacion);
      requestAnimationFrame(() => emailRef.current?.focus());
      return;
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={cambiarApertura}>
      <DialogTrigger
        render={
          <Button
            className="h-11 rounded-full px-4"
          />
        }
      >
        <Plus className="size-4" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-app-panel text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar alumno</DialogTitle>
          <DialogDescription className="text-content-muted">
            Podrá ingresar a RTTP usando este email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4" aria-busy={creando}>
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
              ref={emailRef}
              type="email"
              autoComplete="off"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              placeholder="juan@email.com"
              className="border-white/10 bg-black/35"
            />
          </label>
          {error && (
            <p id={errorId} role="alert" className="text-xs text-red-300">
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose
              render={<Button variant="ghost" className="text-content-muted" />}
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
