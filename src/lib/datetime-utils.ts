const BUSINESS_TIMEZONE = "America/Cancun";

function getOffsetStr(date: Date = new Date(), timeZone = BUSINESS_TIMEZONE): string {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone,
      timeZoneName: "longOffset",
    }).formatToParts(date);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value;
    return offset?.replace("GMT", "") || "+00:00";
  } catch {
    return "-05:00";
  }
}

export function naiveToISO(value: string, timeZone = BUSINESS_TIMEZONE): string {
  if (!value) return "";
  const offset = getOffsetStr(new Date(value + ":00Z"), timeZone);
  return new Date(value + ":00" + offset).toISOString();
}

export function formatDateTime(d: string, timeZone = BUSINESS_TIMEZONE): string {
  if (!d) return "";
  return new Date(d).toLocaleString("es-MX", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateTimeLocal(d: string, timeZone = BUSINESS_TIMEZONE): string {
  if (!d) return "";
  const date = new Date(d);
  const dateStr = date.toLocaleDateString("en-CA", { timeZone });
  const timeStr = date.toLocaleTimeString("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateStr}T${timeStr}`;
}

export type DateRange = { from: string; to: string };

type LegacyPeriod = "day" | "week" | "month";

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isDateString(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(parseDate(value).getTime());
}

export function businessToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: BUSINESS_TIMEZONE });
}

export function shiftDays(date: string, days: number): string {
  const d = parseDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

export function legacyRange(period: LegacyPeriod, offset: number): DateRange {
  const today = businessToday();

  if (period === "day") {
    const day = shiftDays(today, offset);
    return { from: day, to: day };
  }

  if (period === "week") {
    const d = parseDate(today);
    d.setUTCDate(d.getUTCDate() + offset * 7);
    const from = new Date(d);
    from.setUTCDate(from.getUTCDate() - from.getUTCDay());
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 6);
    return { from: formatDate(from), to: formatDate(to) };
  }

  const current = parseDate(today);
  const first = new Date(
    Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + offset, 1),
  );
  const last = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  );
  return { from: formatDate(first), to: formatDate(last) };
}

export function rangeFromParams(
  params: { get(name: string): string | null },
  fallbackPeriod: LegacyPeriod = "day",
): DateRange {
  const from = params.get("from");
  const to = params.get("to");
  if (isDateString(from) && isDateString(to)) {
    return from <= to ? { from, to } : { from: to, to: from };
  }

  const rawPeriod = params.get("period");
  const period =
    rawPeriod === "day" || rawPeriod === "week" || rawPeriod === "month"
      ? rawPeriod
      : fallbackPeriod;
  const rawOffset = params.get("offset");
  const parsedOffset = rawOffset ? Number(rawOffset) : 0;
  const offset = Number.isFinite(parsedOffset) ? Math.trunc(parsedOffset) : 0;

  return legacyRange(period, offset);
}

export function rangeToISO({ from, to }: DateRange): { start: string; end: string } {
  return {
    start: naiveToISO(`${from}T00:00`),
    end: naiveToISO(`${shiftDays(to, 1)}T00:00`),
  };
}

export function rangeLabel({ from, to }: DateRange): string {
  const format = (date: string, options: Intl.DateTimeFormatOptions) =>
    new Date(`${date}T00:00:00Z`).toLocaleDateString("es-MX", {
      timeZone: "UTC",
      ...options,
    });

  if (from === to) {
    return format(from, { day: "numeric", month: "long", year: "numeric" });
  }

  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const fromLabel = format(from, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const toLabel = format(to, { day: "numeric", month: "short", year: "numeric" });
  return `${fromLabel} - ${toLabel}`;
}

export function yearRange(year: number): DateRange {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export { BUSINESS_TIMEZONE };
