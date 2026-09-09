"use client";

import { useMemo, useState } from "react";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Repeat2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  monthlyOrdinalForDate,
  RecurrenceRule,
  weekdayForDate,
} from "@/domain/schedule/recurrence";
import { addDays, localDate } from "@/lib/rttp-agenda";
import { cn } from "@/lib/utils";

const weekdayLabels = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const weekdayNames = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];
const ordinalNames = ["primer", "segundo", "tercer", "cuarto", "quinto"];

export type RecurrenceMode =
  | "none"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom";

export type RecurrenceDraft = {
  mode: RecurrenceMode;
  interval: number;
  weekdays: number[];
  endType: "count" | "date";
  count: number;
  until: string;
};

export function defaultRecurrenceDraft(startDate: string): RecurrenceDraft {
  return {
    mode: "none",
    interval: 1,
    weekdays: [weekdayForDate(startDate)],
    endType: "count",
    count: 8,
    until: addDays(startDate, 56),
  };
}

export function recurrenceRuleFromDraft(
  startDate: string,
  draft: RecurrenceDraft,
): RecurrenceRule | null {
  if (draft.mode === "none") return null;

  const end =
    draft.endType === "count"
      ? { type: "count" as const, count: draft.count }
      : { type: "date" as const, date: draft.until };

  if (draft.mode === "monthly") {
    return {
      cadence: "monthly",
      interval: 1,
      weekday: weekdayForDate(startDate),
      ordinal: monthlyOrdinalForDate(startDate),
      end,
    };
  }

  return {
    cadence: "weekly",
    interval:
      draft.mode === "biweekly"
        ? 2
        : draft.mode === "custom"
          ? draft.interval
          : 1,
    weekdays:
      draft.mode === "custom"
        ? draft.weekdays
        : [weekdayForDate(startDate)],
    end,
  };
}

function dateFromValue(value: string) {
  return new Date(`${value}T12:00:00`);
}

function longDate(value: string) {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateFromValue(value));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function ScheduleDatePicker({
  value,
  onChange,
  min,
  label = "Fecha",
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const today = localDate();

  return (
    <label className="block min-w-0 space-y-2">
      <span className="text-xs font-medium text-white/60">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              aria-label={`${label}: ${longDate(value)}`}
              className="h-11 w-full justify-between rounded-xl border-white/10 bg-black/25 px-3 text-left text-sm font-normal text-white hover:bg-white/[0.06] hover:text-white"
            />
          }
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-cyan-200/70" />
            <span className="truncate">{longDate(value)}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-white/40" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto rounded-2xl border border-white/10 bg-app-panel p-3 text-white shadow-2xl"
        >
          <div className="mb-2 flex gap-2">
            {[
              ["Hoy", today],
              ["Mañana", addDays(today, 1)],
            ].map(([text, date]) => (
              <Button
                key={text}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange(date);
                  setOpen(false);
                }}
                disabled={Boolean(min && date < min)}
                className="rounded-full border-white/10 bg-white/[0.03] text-white/70 hover:bg-cyan-300/10 hover:text-cyan-100"
              >
                {text}
              </Button>
            ))}
          </div>
          <Calendar
            mode="single"
            locale={es}
            selected={dateFromValue(value)}
            defaultMonth={dateFromValue(value)}
            disabled={min ? { before: dateFromValue(min) } : undefined}
            onSelect={(selected) => {
              if (!selected) return;
              onChange(localDate(selected));
              setOpen(false);
            }}
            className="rounded-xl bg-transparent p-1 [--cell-size:--spacing(9)]"
            classNames={{
              today: "rounded-lg bg-cyan-300/10 text-cyan-100",
              selected:
                "rounded-lg bg-cyan-300 text-indigo-950 hover:bg-cyan-200",
            }}
          />
        </PopoverContent>
      </Popover>
    </label>
  );
}

const timeOptions = Array.from({ length: 76 }, (_, index) => {
  const minutes = 5 * 60 + index * 15;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
});

export function ScheduleTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <label className="block min-w-0 space-y-2">
      <span className="text-xs font-medium text-white/60">Hora (opcional)</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              aria-label={value ? `Hora: ${value}` : "Hora: sin hora"}
              className="h-11 w-full justify-between rounded-xl border-white/10 bg-black/25 px-3 text-sm font-normal text-white hover:bg-white/[0.06] hover:text-white"
            />
          }
        >
          <span className="flex items-center gap-2">
            <Clock3 className="size-4 text-cyan-200/70" />
            {value ? `${value} hs` : "Sin hora"}
          </span>
          <ChevronDown className="size-4 text-white/40" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 rounded-2xl border border-white/10 bg-app-panel p-3 text-white shadow-2xl"
        >
          <div className="mb-3">
            <div className="text-sm font-medium">Elegí una hora</div>
            <div className="mt-1 text-xs text-white/50">
              Intervalos de 15 minutos.
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="mb-2 w-full justify-between rounded-xl text-white/65 hover:bg-white/[0.06] hover:text-white"
          >
            Sin hora
            {!value && <Check className="size-4 text-cyan-200" />}
          </Button>
          <div className="grid max-h-64 grid-cols-3 gap-1 overflow-y-auto pr-1">
            {timeOptions.map((time) => (
              <Button
                key={time}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(time);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-lg tabular-nums",
                  value === time
                    ? "bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
                    : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                )}
              >
                {time}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </label>
  );
}

function recurrenceLabel(date: string, mode: RecurrenceMode) {
  const weekday = weekdayNames[weekdayForDate(date)];
  if (mode === "weekly") return `Cada ${weekday}`;
  if (mode === "biweekly") return `Cada 2 semanas · ${weekday}`;
  if (mode === "monthly") {
    const ordinal = ordinalNames[monthlyOrdinalForDate(date) - 1];
    return `Cada mes · ${ordinal} ${weekday}`;
  }
  if (mode === "custom") return "Personalizada";
  return "No se repite";
}

export function ScheduleRecurrencePicker({
  startDate,
  value,
  onChange,
}: {
  startDate: string;
  value: RecurrenceDraft;
  onChange: (value: RecurrenceDraft) => void;
}) {
  const [open, setOpen] = useState(false);
  const options: RecurrenceMode[] = [
    "none",
    "weekly",
    "biweekly",
    "monthly",
    "custom",
  ];
  const summary = useMemo(
    () => recurrenceLabel(startDate, value.mode),
    [startDate, value.mode],
  );

  function selectMode(mode: RecurrenceMode) {
    onChange({
      ...value,
      mode,
      weekdays:
        mode === "custom" ? value.weekdays : [weekdayForDate(startDate)],
    });
    if (mode !== "custom") setOpen(false);
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-2">
        <span className="text-xs font-medium text-white/60">Frecuencia</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                aria-label={`Frecuencia: ${summary}`}
                className="h-11 w-full justify-between rounded-xl border-white/10 bg-black/25 px-3 text-sm font-normal text-white hover:bg-white/[0.06] hover:text-white"
              />
            }
          >
            <span className="flex items-center gap-2">
              <Repeat2 className="size-4 text-violet-200/75" />
              {summary}
            </span>
            <ChevronDown className="size-4 text-white/40" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-app-panel p-2 text-white shadow-2xl"
          >
            {options.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => selectMode(mode)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  value.mode === mode
                    ? "bg-cyan-300/10 text-cyan-100"
                    : "text-white/65 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                {recurrenceLabel(startDate, mode)}
                {value.mode === mode && <Check className="size-4" />}
              </button>
            ))}

            {value.mode === "custom" && (
              <div className="mt-2 space-y-4 border-t border-white/[0.07] p-3">
                <label className="block space-y-2">
                  <span className="text-xs text-white/55">
                    Repetir cada cuántas semanas
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={value.interval}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        interval: Math.min(
                          12,
                          Math.max(1, event.target.valueAsNumber || 1),
                        ),
                      })
                    }
                    className="h-10 border-white/10 bg-black/25"
                  />
                </label>
                <div>
                  <div className="mb-2 text-xs text-white/55">Días</div>
                  <div className="grid grid-cols-7 gap-1">
                    {weekdayLabels.map((label, weekday) => {
                      const selected = value.weekdays.includes(weekday);
                      return (
                        <button
                          key={`${label}-${weekday}`}
                          type="button"
                          aria-label={weekdayNames[weekday]}
                          aria-pressed={selected}
                          onClick={() => {
                            const weekdays = selected
                              ? value.weekdays.filter((day) => day !== weekday)
                              : [...value.weekdays, weekday].sort(
                                  (a, b) => a - b,
                                );
                            if (weekdays.length === 0) return;
                            onChange({ ...value, weekdays });
                          }}
                          className={cn(
                            "grid aspect-square place-items-center rounded-full text-xs font-medium transition-colors",
                            selected
                              ? "bg-cyan-300 text-indigo-950"
                              : "bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-full bg-cyan-300 text-indigo-950 hover:bg-cyan-200"
                >
                  Aplicar frecuencia
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </label>

      {value.mode !== "none" && (
        <div className="rounded-2xl border border-violet-200/10 bg-violet-300/[0.04] p-3">
          <div className="mb-3 text-xs font-medium text-violet-100/75">
            Finaliza
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["count", "Después de"],
              ["date", "En una fecha"],
            ].map(([type, label]) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    endType: type as RecurrenceDraft["endType"],
                  })
                }
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm transition-colors",
                  value.endType === type
                    ? "border-violet-200/25 bg-violet-300/10 text-violet-50"
                    : "border-white/[0.07] text-white/55 hover:text-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3">
            {value.endType === "count" ? (
              <label className="flex items-center gap-3">
                <Input
                  type="number"
                  min={2}
                  max={52}
                  value={value.count}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      count: Math.min(
                        52,
                        Math.max(2, event.target.valueAsNumber || 2),
                      ),
                    })
                  }
                  className="h-10 w-24 border-white/10 bg-black/25 text-center"
                />
                <span className="text-sm text-white/55">sesiones en total</span>
              </label>
            ) : (
              <ScheduleDatePicker
                label="Repetir hasta"
                value={value.until}
                min={addDays(startDate, 1)}
                onChange={(until) => onChange({ ...value, until })}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
