"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export function AppErrorState({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-app px-6 pt-[var(--app-top-inset)] text-foreground">
      <div role="alert" className="max-w-md rounded-3xl border border-border bg-app-panel p-6">
        <h1 className="text-xl font-semibold">No pudimos abrir esta pantalla</h1>
        <p className="mt-3 text-sm text-content-muted">
          Revisá tu conexión y recargá para volver a intentarlo.
        </p>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          Recargar pantalla
        </Button>
      </div>
    </main>
  );
}
