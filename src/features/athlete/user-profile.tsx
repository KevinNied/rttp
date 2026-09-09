"use client";

import { Card, CardContent } from "@/components/ui/card";
import { User } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

import {
  desktopPageShellClassName,
  pageDescriptionClassName,
  pageEyebrowClassName,
  pageTitleClassName,
} from "@/features/shared/page-shell";
import { VersionLabel } from "@/features/shared/version-label";

export function PerfilUsuario({
  usuario,
  entrenadorAsignado,
}: {
  usuario: User;
  entrenadorAsignado?: User;
}) {
  const assignedCoach =
    usuario.role === "athlete" ? entrenadorAsignado : undefined;

  return (
    <div
      className={cn(
        desktopPageShellClassName,
        "flex min-h-[calc(100dvh-10rem)] flex-col",
      )}
    >
      <div className="flex w-full flex-1 flex-col">
        <div>
          <div className={pageEyebrowClassName}>Tu espacio</div>
          <h1 className={pageTitleClassName}>Perfil</h1>
          <p className={pageDescriptionClassName}>
            Tus datos y preferencias de RTTP.
          </p>
        </div>

        <Card className="mt-7 border-white/[0.08] bg-app-panel text-white shadow-none">
          <CardContent className="p-5 md:p-7 xl:p-8">
            <div className="grid gap-8 xl:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.3fr)] xl:items-start">
              <div>
                <div className="inline-flex rounded-2xl border border-cyan-200/12 bg-cyan-300/[0.06] px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-cyan-100/75">
                  {usuario.role === "coach" ? "Entrenador" : "Atleta"}
                </div>
                <h2 className="mt-5 truncate text-2xl font-medium md:text-3xl">
                  {usuario.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {usuario.role === "coach"
                    ? "Tu identidad dentro del workspace de planificación."
                    : entrenadorAsignado
                      ? "Tu identidad y vínculo actual dentro de RTTP."
                      : "Tu espacio de entrenamiento independiente en RTTP."}
                </p>
              </div>

              <div>
                <div className="text-sm font-medium text-white/75">
                  Información de la cuenta
                </div>
                <p className="mt-1 text-sm text-white/50">
                  Estos datos identifican tu experiencia actual.
                </p>
                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div
                    className={cn(
                      "min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4",
                      !assignedCoach && "sm:col-span-2",
                    )}
                  >
                    <dt className="text-xs font-medium uppercase tracking-[0.12em] text-white/50">
                      Cuenta
                    </dt>
                    <dd className="mt-2 truncate text-base text-white/80">
                      {usuario.email}
                    </dd>
                  </div>
                  {assignedCoach && (
                    <div className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-white/50">
                        Entrenador
                      </dt>
                      <dd className="mt-2 min-w-0">
                        <div className="truncate text-base font-medium">
                        {assignedCoach.name}
                        </div>
                        <div className="mt-1 truncate text-sm text-white/55">
                        {assignedCoach.email}
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto pt-12 text-center xl:text-right">
          <VersionLabel />
        </div>
      </div>
    </div>
  );
}
