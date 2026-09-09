"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  UserRound,
} from "lucide-react";

import { BlobatarAvatar } from "@/components/blobatar-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/rttp-data";
import { cn } from "@/lib/utils";

import { AthleteView, CoachView } from "@/application/navigation/routes";
import {
  readSidebarCompactPreference,
  writeSidebarCompactPreference,
} from "@/application/preferences/ui-preferences";
import { Logo } from "@/features/shared/logo";
import { ThemeToggle } from "@/features/shared/theme-toggle";
import { VersionLabel } from "@/features/shared/version-label";
import {
  athleteNavigation,
  coachNavigation,
} from "@/features/shell/navigation-items";

export function AppShell({
  usuario,
  vistaPrevia,
  workoutImmersive,
  vistaEntrenador,
  vistaAtleta,
  syncError,
  onClosePreview,
  onLogout,
  navigate,
  children,
}: {
  usuario: User;
  vistaPrevia: boolean;
  workoutImmersive: boolean;
  vistaEntrenador: CoachView;
  vistaAtleta: AthleteView;
  syncError: string | null;
  onClosePreview: () => void;
  onLogout: () => void;
  navigate: (path: string) => void;
  children: React.ReactNode;
}) {
  const esEntrenador = usuario.role === "coach";
  const [sidebarCompact, setSidebarCompact] = useState(
    readSidebarCompactPreference,
  );
  const navegacion = esEntrenador ? coachNavigation : athleteNavigation;
  const navegacionMobile = navegacion.filter((item) => item.view !== "profile");

  useEffect(() => {
    writeSidebarCompactPreference(sidebarCompact);
  }, [sidebarCompact]);

  return (
    <div className="min-h-dvh bg-app text-white selection:bg-cyan-300 selection:text-black">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_-10%,rgba(34,211,238,.14),transparent_32%),radial-gradient(circle_at_10%_70%,rgba(124,58,237,.15),transparent_35%)]" />
      {!vistaPrevia && !workoutImmersive && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/[0.07] bg-app-sidebar py-7 backdrop-blur-xl lg:flex",
            sidebarCompact ? "w-24 px-3" : "w-64 px-5",
          )}
        >
          <div
            className={cn(
              "flex h-10 items-center",
              sidebarCompact ? "justify-center" : "justify-start",
            )}
          >
            <div className={cn(sidebarCompact && "hidden")}>
              <Logo />
            </div>
            {sidebarCompact && (
              <Image
                src="/rttp-mark-v2.png"
                alt="RTTP"
                width={40}
                height={40}
                unoptimized
                className="size-10 rounded-lg bg-indigo-950 p-1 object-contain drop-shadow-[0_0_12px_rgba(99,102,241,.18)] dark:bg-transparent dark:p-0"
              />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={
              sidebarCompact
                ? "Expandir barra lateral"
                : "Compactar barra lateral"
            }
            title={
              sidebarCompact
                ? "Expandir barra lateral"
                : "Compactar barra lateral"
            }
            onClick={() => setSidebarCompact((current) => !current)}
            className="absolute -right-4 top-1/2 hidden size-8 -translate-y-1/2 rounded-full border border-cyan-200/25 bg-app-elevated text-cyan-100/60 shadow-[0_6px_20px_rgba(0,0,0,.35)] hover:border-cyan-200/40 hover:bg-app-panel hover:text-cyan-100 lg:inline-flex"
          >
            {sidebarCompact ? (
              <ChevronsRight className="size-4" />
            ) : (
              <ChevronsLeft className="size-4" />
            )}
          </Button>
          {!sidebarCompact && (
            <div className="mt-10 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
              {esEntrenador ? "Workspace" : "Entrenamiento"}
            </div>
          )}
          <nav className={cn("space-y-1.5", sidebarCompact ? "mt-6" : "mt-3")}>
            {navegacion.map((item) => {
              const NavIcon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  title={item.label}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "group flex w-full items-center rounded-2xl transition-colors",
                    sidebarCompact
                      ? "justify-center px-0 py-3"
                      : "gap-3 px-3 py-3.5",
                    (
                      esEntrenador
                        ? item.view === vistaEntrenador
                        : item.view === vistaAtleta
                    )
                      ? "bg-indigo-300/10 text-white"
                      : "text-indigo-100/45 hover:bg-indigo-300/[0.07] hover:text-white/80",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.035]">
                    <NavIcon className="size-4" />
                  </span>
                  {!sidebarCompact && (
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-sm font-medium leading-tight">
                        {item.label}
                      </span>
                      <span className="mt-1 block truncate text-[10px] leading-tight text-white/25 transition-colors group-hover:text-white/40">
                        {item.description}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div
            className={cn(
              "mt-auto rounded-2xl border border-indigo-200/[0.08] bg-indigo-300/[0.06] p-3.5",
              sidebarCompact && "px-2.5",
            )}
          >
            <div
              className={cn(
                "flex items-center",
                sidebarCompact ? "justify-center" : "gap-3",
              )}
            >
              <BlobatarAvatar
                name={usuario.email}
                size={sidebarCompact ? "sm" : "lg"}
              />
              {!sidebarCompact && (
                <div className="min-w-0">
                  <div className="truncate text-sm">{usuario.name}</div>
                  <div className="text-[10px] text-indigo-100/35">
                    {esEntrenador ? "Entrenador" : "Atleta"}
                  </div>
                </div>
              )}
            </div>
            <ThemeToggle compact={sidebarCompact} className="mt-3" />
            <Button
              variant="ghost"
              onClick={onLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className={cn(
                "mt-2 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-xs text-white/60 hover:bg-red-300/10 hover:text-red-100",
                sidebarCompact
                  ? "w-full justify-center"
                  : "w-full justify-between",
              )}
            >
              {!sidebarCompact && <span>Cerrar sesión</span>}
              <LogOut className="size-4" />
            </Button>
            <VersionLabel className="mt-3 block text-center" />
          </div>
        </aside>
      )}

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 flex h-[calc(3.75rem+env(safe-area-inset-top))] items-center justify-between bg-app/75 pb-0 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)] backdrop-blur-2xl after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-6 after:h-6 after:bg-gradient-to-b after:from-app/70 after:to-transparent lg:h-18 lg:px-8 lg:pt-0 lg:after:hidden",
          workoutImmersive && "hidden",
          !vistaPrevia &&
            (sidebarCompact ? "lg:left-24 lg:hidden" : "lg:left-64 lg:hidden"),
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(!vistaPrevia && "hidden lg:block")}>
            <Logo />
          </div>
          <div className="flex items-center lg:hidden">
            <Image
              src="/rttp-mark-v2.png"
              alt="RTTP"
              width={32}
              height={32}
              loading="eager"
              unoptimized
              className="size-8 rounded-lg bg-indigo-950 p-0.5 object-contain drop-shadow-[0_0_10px_rgba(99,102,241,.18)] dark:bg-transparent dark:p-0"
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle compact />
          {!vistaPrevia && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Abrir perfil"
              title="Abrir perfil"
              onClick={() =>
                navigate(esEntrenador ? "/coach/profile" : "/profile")
              }
              className={cn(
                "rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/55 hover:bg-white/[0.08] hover:text-white",
                (esEntrenador
                  ? vistaEntrenador === "profile"
                  : vistaAtleta === "profile") &&
                  "border-cyan-200/20 bg-cyan-300/10 text-cyan-100",
              )}
            >
              <UserRound className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/55 hover:bg-white/[0.08] hover:text-white"
          >
            <LogOut />
          </Button>
        </div>
      </header>

      <main
        className={cn(
          "relative min-h-dvh pt-[calc(3.75rem+env(safe-area-inset-top))] lg:pt-18",
          workoutImmersive && "pt-0 lg:pt-0",
          !vistaPrevia &&
            !workoutImmersive &&
            (sidebarCompact ? "lg:pl-24 lg:pt-0" : "lg:pl-64 lg:pt-0"),
          !vistaPrevia &&
            !workoutImmersive &&
            "pb-[calc(5.75rem+env(safe-area-inset-bottom))] lg:pb-0",
        )}
      >
        {syncError && !workoutImmersive && (
          <div
            role="alert"
            className="relative z-20 mx-auto max-w-[1760px] px-4 pt-4 sm:px-6 lg:px-10"
          >
            <p className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">
              No pudimos sincronizar con la base de datos. {syncError}
            </p>
          </div>
        )}
        {vistaPrevia && (
          <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-3 px-4 pt-6 sm:px-6 lg:px-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClosePreview}
              className="-ml-3 rounded-full text-white/65 hover:bg-white/[0.07] hover:text-white"
            >
              <ArrowLeft />
              Volver a editar
            </Button>
            <Badge className="border-cyan-200/20 bg-cyan-300/10 text-[9px] uppercase tracking-[0.12em] text-cyan-100">
              Vista previa · Solo lectura
            </Badge>
          </div>
        )}
        <div
          inert={vistaPrevia ? true : undefined}
          className={cn(
            vistaPrevia && "pointer-events-none select-none opacity-85",
          )}
        >
          {children}
        </div>
      </main>
      {!vistaPrevia && !workoutImmersive && (
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] lg:hidden">
          <div className="pointer-events-auto flex w-full max-w-sm items-center gap-1 rounded-[1.35rem] border border-border bg-app-panel/88 p-1.5 shadow-[0_14px_45px_rgba(4,8,18,.18)] backdrop-blur-2xl dark:border-white/[0.09] dark:shadow-[0_14px_45px_rgba(4,8,18,.38)]">
            {navegacionMobile.map((item) => {
              const NavIcon = item.icon;
              const activo = esEntrenador
                ? item.view === vistaEntrenador
                : item.view === vistaAtleta;
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-label={item.label}
                  title={item.label}
                  aria-current={activo ? "page" : undefined}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1rem] px-1 transition-[background-color,color] duration-300 ease-out",
                    activo
                      ? "bg-cyan-500/10 text-cyan-800 shadow-[0_8px_24px_rgba(34,211,238,.1)] dark:bg-cyan-300/14 dark:text-cyan-100"
                      : "text-foreground/55 hover:bg-foreground/[0.05] hover:text-foreground dark:text-white/45 dark:hover:bg-white/[0.06] dark:hover:text-white/80",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border transition-colors",
                      activo
                        ? "border-cyan-600/20 bg-cyan-500/10 dark:border-cyan-200/20 dark:bg-cyan-300/12"
                        : "border-border bg-app-elevated dark:border-white/[0.06] dark:bg-white/[0.03]",
                    )}
                  >
                    <NavIcon className="size-4" />
                  </span>
                  <span className="max-w-full truncate text-[10px] font-medium leading-none">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
