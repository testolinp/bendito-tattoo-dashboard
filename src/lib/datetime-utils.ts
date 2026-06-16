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

export { BUSINESS_TIMEZONE };
