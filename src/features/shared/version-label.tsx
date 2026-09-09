import { appVersion } from "@/lib/app-version";
import { cn } from "@/lib/utils";

export function VersionLabel({ className }: { className?: string }) {
  return (
    <span
      aria-label={`Versión ${appVersion}`}
      className={cn(
        "text-[9px] font-medium tabular-nums tracking-[0.08em] text-white/25",
        className,
      )}
    >
      v{appVersion}
    </span>
  );
}
