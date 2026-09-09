export type RecurrenceEnd =
  | { type: "count"; count: number }
  | { type: "date"; date: string };

export type RecurrenceRule =
  | {
      cadence: "weekly";
      interval: number;
      weekdays: number[];
      end: RecurrenceEnd;
    }
  | {
      cadence: "monthly";
      interval: number;
      weekday: number;
      ordinal: number;
      end: RecurrenceEnd;
    };

const maxOccurrences = 52;

function parseLocalDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function formatLocalDate(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function mondayWeekday(date: Date) {
  return (date.getDay() + 6) % 7;
}

function startOfLocalWeek(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - mondayWeekday(start));
  return start;
}

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function occurrenceLimit(end: RecurrenceEnd) {
  return end.type === "count"
    ? Math.min(maxOccurrences, Math.max(2, end.count))
    : maxOccurrences;
}

function includesDate(date: string, end: RecurrenceEnd) {
  return end.type === "count" || date <= end.date;
}

export function weekdayForDate(date: string) {
  return mondayWeekday(parseLocalDate(date));
}

export function monthlyOrdinalForDate(date: string) {
  return Math.floor((parseLocalDate(date).getDate() - 1) / 7) + 1;
}

export function generateRecurrenceDates(
  startDate: string,
  rule: RecurrenceRule | null,
) {
  if (!rule) return [startDate];

  const limit = occurrenceLimit(rule.end);
  const dates: string[] = [];

  if (rule.cadence === "weekly") {
    const start = parseLocalDate(startDate);
    const initialWeek = startOfLocalWeek(start);
    const weekdays = [...new Set(rule.weekdays)]
      .filter((day) => day >= 0 && day <= 6)
      .sort((a, b) => a - b);
    const maxSearchDays =
      maxOccurrences * Math.max(1, rule.interval) * 7 + 7;

    for (let offset = 0; offset <= maxSearchDays; offset += 1) {
      const candidate = new Date(start);
      candidate.setDate(candidate.getDate() + offset);
      const candidateDate = formatLocalDate(candidate);
      if (!includesDate(candidateDate, rule.end)) break;

      const weekOffset = Math.floor(
        daysBetween(initialWeek, startOfLocalWeek(candidate)) / 7,
      );
      if (
        weekOffset % Math.max(1, rule.interval) === 0 &&
        weekdays.includes(mondayWeekday(candidate))
      ) {
        dates.push(candidateDate);
      }
      if (dates.length >= limit) break;
    }
  } else {
    const start = parseLocalDate(startDate);

    const maxMonthOffset =
      maxOccurrences * Math.max(1, rule.interval) + 12;
    for (
      let monthOffset = 0;
      monthOffset <= maxMonthOffset;
      monthOffset += 1
    ) {
      if (monthOffset % Math.max(1, rule.interval) !== 0) continue;

      const firstOfMonth = new Date(
        start.getFullYear(),
        start.getMonth() + monthOffset,
        1,
        12,
      );
      const firstWeekday = mondayWeekday(firstOfMonth);
      const day =
        1 +
        ((rule.weekday - firstWeekday + 7) % 7) +
        (Math.max(1, rule.ordinal) - 1) * 7;
      const candidate = new Date(
        firstOfMonth.getFullYear(),
        firstOfMonth.getMonth(),
        day,
        12,
      );
      if (candidate.getMonth() !== firstOfMonth.getMonth()) continue;

      const candidateDate = formatLocalDate(candidate);
      if (candidateDate < startDate) continue;
      if (!includesDate(candidateDate, rule.end)) break;
      dates.push(candidateDate);
      if (dates.length >= limit) break;
    }
  }

  return dates;
}
