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
  return (
    <div
      className={cn(
        desktopPageShellClassName,
        "flex min-h-[calc(100dvh-10rem)] flex-col",
      )}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <div>
          <div className={pageEyebrowClassName}>Tu espacio</div>
          <h1 className={pageTitleClassName}>Perfil</h1>
          <p className={pageDescriptionClassName}>
            Tus datos y preferencias de RTTP.
          </p>
        </div>

        <Card className="mt-7 border-white/[0.08] bg-app-panel text-white shadow-none">
          <CardContent className="p-5 md:p-6">
            <div>
              <h2 className="truncate text-xl font-medium">{usuario.name}</h2>
              <p className="mt-1 text-xs text-white/35">
                Información de la cuenta
              </p>
            </div>
            <dl className="mt-6 divide-y divide-white/[0.06] border-y border-white/[0.06]">
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-xs text-white/35">Rol</dt>
                <dd className="text-xs font-medium">
                  {usuario.role === "coach" ? "Entrenador" : "Atleta"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-xs text-white/35">Cuenta</dt>
                <dd className="truncate text-right text-xs text-white/65">
                  {usuario.email}
                </dd>
              </div>
              {usuario.role === "athlete" && (
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-xs text-white/35">Entrenador</dt>
                  <dd className="min-w-0 text-right">
                    <div className="truncate text-xs font-medium">
                      {entrenadorAsignado?.name ?? "Sin asignar"}
                    </div>
                    {entrenadorAsignado && (
                      <div className="mt-1 truncate text-[10px] text-white/35">
                        {entrenadorAsignado.email}
                      </div>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <div className="mt-auto pt-12 text-center">
          <VersionLabel />
        </div>
      </div>
    </div>
  );
}
