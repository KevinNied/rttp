"use client";

import { useEffect, useState } from "react";

export function AppLoadingState() {
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowLabel(true), 700);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <main
      aria-busy="true"
      aria-label="Cargando RTTP"
      className="min-h-dvh bg-app px-4 py-8 text-foreground sm:px-6 lg:px-10"
    >
      <div className="mx-auto max-w-[1760px] animate-pulse">
        <div className="h-8 w-28 rounded-xl bg-app-elevated" />
        <div className="mt-12 h-3 w-32 rounded-full bg-app-elevated" />
        <div className="mt-3 h-10 w-72 max-w-full rounded-2xl bg-app-elevated" />
        <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.6fr)]">
          <div className="h-72 rounded-3xl bg-app-panel" />
          <div className="h-72 rounded-3xl bg-app-panel" />
        </div>
      </div>
      {showLabel && (
        <p role="status" className="mx-auto mt-6 max-w-[1760px] text-sm text-content-muted">
          Estamos cargando tu espacio…
        </p>
      )}
    </main>
  );
}

