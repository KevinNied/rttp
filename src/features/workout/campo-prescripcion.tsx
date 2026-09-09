"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function prescriptionDisplayValue(value: number, emptyWhenZero: boolean) {
  return emptyWhenZero && value === 0 ? "" : String(value);
}

export function CampoPrescripcion({
  label,
  hint,
  step = 1,
  emptyWhenZero = false,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  step?: number;
  emptyWhenZero?: boolean;
  value: number;
  onChange: (value: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draftValue, setDraftValue] = useState(
    prescriptionDisplayValue(value, emptyWhenZero),
  );
  const acceptsDecimals = step < 1;

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDraftValue(prescriptionDisplayValue(value, emptyWhenZero));
    }
  }, [emptyWhenZero, value]);

  function updateValue(nextValue: number) {
    const normalizedValue = Math.max(0, Math.round(nextValue * 100) / 100);
    setDraftValue(prescriptionDisplayValue(normalizedValue, emptyWhenZero));
    onChange(normalizedValue);
  }

  function updateDraft(nextDraft: string) {
    const normalizedDraft = nextDraft.replace(",", ".");
    const validPattern = acceptsDecimals ? /^\d*(?:\.\d*)?$/ : /^\d*$/;
    if (!validPattern.test(normalizedDraft)) return;

    setDraftValue(nextDraft);
    if (normalizedDraft === "" || normalizedDraft === ".") return;

    const parsedValue = Number(normalizedDraft);
    if (Number.isFinite(parsedValue)) {
      onChange(Math.max(0, parsedValue));
    }
  }

  function commitDraft() {
    const parsedValue = Number(draftValue.replace(",", "."));
    updateValue(Number.isFinite(parsedValue) ? parsedValue : 0);
  }

  return (
    <div className="rounded-2xl border border-white/[0.09] bg-black/30 p-3.5 text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-50/75">
        {label}
      </div>
      <div className="mt-2.5 flex items-center justify-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Reducir ${label.toLowerCase()}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => updateValue(value - step)}
          className="size-9 rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white"
        >
          <Minus />
        </Button>
        <Input
          ref={inputRef}
          aria-label={label}
          role="spinbutton"
          aria-valuemin={0}
          aria-valuenow={value}
          type="text"
          inputMode={acceptsDecimals ? "decimal" : "numeric"}
          value={draftValue}
          placeholder={emptyWhenZero ? "0" : undefined}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => updateDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="h-11 w-16 border-0 bg-transparent p-0 text-center text-2xl font-normal tabular-nums text-white shadow-none focus-visible:ring-0"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => updateValue(value + step)}
          className="size-9 rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white"
        >
          <Plus />
        </Button>
      </div>
      <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/65">
        {hint}
      </div>
    </div>
  );
}
