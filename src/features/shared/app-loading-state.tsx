"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { readSidebarCompactPreference } from "@/application/preferences/ui-preferences";
import { cn } from "@/lib/utils";

const subscribeToSidebarPreference = () => () => undefined;

export function AppLoadingState() {
  const [showLabel, setShowLabel] = useState(false);
  const sidebarCompact = useSyncExternalStore(
    subscribeToSidebarPreference,
    readSidebarCompactPreference,
    () => false,
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowLabel(true), 700);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <main
      aria-busy="true"
      aria-label="Cargando RTTP"
      className="relative min-h-dvh overflow-hidden bg-app text-foreground"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_-10%,rgba(34,211,238,.14),transparent_32%),radial-gradient(circle_at_10%_70%,rgba(124,58,237,.15),transparent_35%)]"
      />
      <div aria-hidden="true" className="animate-pulse">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-10 hidden border-r border-white/[0.07] bg-app-sidebar py-7 lg:block",
            sidebarCompact ? "w-24 px-3" : "w-64 px-5",
          )}
        >
          <div
            className={cn(
              "h-10 rounded-xl bg-app-elevated",
              sidebarCompact ? "mx-auto w-10" : "w-28",
            )}
          />
          <div className="mt-12 h-3 w-20 rounded-full bg-app-elevated" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-14 rounded-2xl bg-app-elevated/70"
              />
            ))}
          </div>
          <div className="absolute inset-x-5 bottom-7 h-36 rounded-2xl bg-app-elevated/70" />
        </aside>

        <header className="fixed inset-x-0 top-0 z-10 flex h-[calc(3.75rem+env(safe-area-inset-top))] items-center justify-between bg-app/75 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-2xl lg:hidden">
          <div className="size-8 rounded-lg bg-app-elevated" />
          <div className="flex gap-2">
            <div className="size-9 rounded-xl bg-app-elevated" />
            <div className="size-9 rounded-xl bg-app-elevated" />
          </div>
        </header>

        <div
          className={cn(
            "min-h-dvh pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-[calc(3.75rem+env(safe-area-inset-top))] lg:pb-0 lg:pt-0",
            sidebarCompact ? "lg:pl-24" : "lg:pl-64",
          )}
        >
          <div className="mx-auto max-w-[1760px] px-4 py-8 sm:px-6 lg:px-10">
            <div className="h-3 w-32 rounded-full bg-app-elevated" />
            <div className="mt-3 h-10 w-72 max-w-full rounded-2xl bg-app-elevated" />
            <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.6fr)]">
              <div className="h-72 rounded-3xl bg-app-panel" />
              <div className="h-72 rounded-3xl bg-app-panel" />
            </div>
          </div>
        </div>

        <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 mx-auto h-[4.25rem] max-w-sm rounded-[1.35rem] bg-app-panel lg:hidden" />
      </div>
      <div
        className={cn(
          "fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-20 px-4 text-center lg:bottom-8",
          sidebarCompact ? "lg:left-24" : "lg:left-64",
        )}
      >
        <p role="status" className="text-sm text-content-muted">
          {showLabel ? "Estamos cargando tu espacio…" : ""}
        </p>
      </div>
    </main>
  );
}
