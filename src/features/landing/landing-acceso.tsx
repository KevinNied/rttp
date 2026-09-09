"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { ThemeToggle } from "@/features/shared/theme-toggle";
import { VersionLabel } from "@/features/shared/version-label";

export function LandingAcceso({
  onAccess,
}: {
  onAccess: (email: string) => boolean;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function ingresar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onAccess(email)) return;
    setError("No encontramos un usuario con ese email.");
  }

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-app pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(34,211,238,.15),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(124,58,237,.2),transparent_38%)]" />
      <ThemeToggle
        compact
        className="absolute right-[max(1.25rem,env(safe-area-inset-right))] top-[max(1.25rem,env(safe-area-inset-top))] z-10"
      />
      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div className="relative size-32 rounded-[2rem] bg-indigo-950/90 shadow-[0_18px_50px_rgba(79,70,229,.18)] dark:bg-transparent dark:shadow-none">
          <Image
            src="/rttp-mark-v2.png"
            alt="Logo de RTTP"
            fill
            priority
            unoptimized
            sizes="128px"
            className="object-contain p-4 drop-shadow-[0_18px_35px_rgba(79,70,229,.28)] dark:p-0"
          />
        </div>

        <div
          aria-label="RTTP"
          className="mt-7 flex items-center gap-1 text-3xl font-semibold tracking-[0.18em]"
        >
          <span className="bg-gradient-to-br from-cyan-200 to-cyan-400 bg-clip-text text-transparent">
            R
          </span>
          <span className="bg-gradient-to-br from-blue-300 to-blue-500 bg-clip-text text-transparent">
            T
          </span>
          <span className="bg-gradient-to-br from-indigo-300 to-indigo-500 bg-clip-text text-transparent">
            T
          </span>
          <span className="bg-gradient-to-br from-violet-300 to-violet-500 bg-clip-text text-transparent">
            P
          </span>
        </div>

        <h1 className="mt-9 text-[2.35rem] font-light leading-[1.08] tracking-[-0.045em]">
          <span className="block">¿Listo para volver</span>
          <span className="block">a tu prime?</span>
        </h1>
        <Dialog>
          <DialogTrigger
            render={
              <Button className="mt-9 h-12 min-w-44 rounded-full border border-blue-200/15 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 px-8 text-white shadow-[0_12px_40px_rgba(79,70,229,.28)] hover:brightness-110" />
            }
          >
            Acceder
            <ArrowRight className="size-4" />
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-app-panel text-white sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Ingresá a RTTP</DialogTitle>
              <DialogDescription className="text-white/40">
                Usá el email asociado a tu perfil.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={ingresar} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-xs text-white/55">Email</span>
                <Input
                  autoFocus
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  placeholder="vos@email.com"
                  aria-invalid={Boolean(error)}
                  className="h-11 border-white/10 bg-black/35"
                />
              </label>
              {error && (
                <p role="alert" className="text-xs text-red-300">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={!email.trim()}
                className="h-11 w-full rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
              >
                Entrar
                <ArrowRight />
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <VersionLabel className="absolute bottom-5 left-1/2 -translate-x-1/2" />
    </main>
  );
}
