import { LoaderCircle } from "lucide-react";

export function FeatureLoadingState() {
  return (
    <div
      role="status"
      className="flex min-h-64 items-center justify-center gap-3 text-sm text-content-muted"
    >
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
      <span>Cargando tu espacio…</span>
    </div>
  );
}
