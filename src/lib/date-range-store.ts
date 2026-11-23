"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import {
  businessToday,
  isDateString,
  rangeFromParams,
  type DateRange,
} from "@/lib/datetime-utils";

const STORAGE_KEY = "bendito-date-range";

let cache: DateRange | null = null;
let fallback: DateRange | null = null;
const listeners = new Set<() => void>();

function defaultRange(): DateRange {
  if (!fallback) {
    const today = businessToday();
    fallback = { from: today, to: today };
  }
  return fallback;
}

function readLocal(): DateRange | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "from" in parsed &&
      "to" in parsed &&
      typeof parsed.from === "string" &&
      typeof parsed.to === "string" &&
      parsed.from <= parsed.to
    ) {
      return { from: parsed.from, to: parsed.to };
    }
  } catch {
    return null;
  }
  return null;
}

function getSnapshot(): DateRange {
  if (!cache) cache = readLocal() ?? defaultRange();
  return cache;
}

function getServerSnapshot(): DateRange {
  return defaultRange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setSharedRange(range: DateRange) {
  cache = range;
  const persist = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
    } catch {
      return false;
    }
    return true;
  };
  persist();
  listeners.forEach((listener) => listener());
}

export function useSharedDateRange() {
  const searchParams = useSearchParams();
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const periodParam = searchParams.get("period");
  const offsetParam = searchParams.get("offset");
  const hasUrlRange =
    (isDateString(fromParam) && isDateString(toParam)) ||
    periodParam !== null ||
    offsetParam !== null;
  const urlRange = useMemo(() => {
    if (!hasUrlRange) return null;
    const params = new URLSearchParams();
    if (fromParam) params.set("from", fromParam);
    if (toParam) params.set("to", toParam);
    if (periodParam) params.set("period", periodParam);
    if (offsetParam) params.set("offset", offsetParam);
    return rangeFromParams(params);
  }, [hasUrlRange, fromParam, toParam, periodParam, offsetParam]);
  const range = urlRange ?? stored;
  const urlFrom = urlRange?.from;
  const urlTo = urlRange?.to;

  useEffect(() => {
    if (urlFrom && urlTo && (stored.from !== urlFrom || stored.to !== urlTo)) {
      setSharedRange({ from: urlFrom, to: urlTo });
    }
  }, [urlFrom, urlTo, stored.from, stored.to]);

  const setRange = useCallback((next: DateRange) => {
    setSharedRange(next);
    const params = new URLSearchParams(window.location.search);
    params.set("from", next.from);
    params.set("to", next.to);
    params.delete("period");
    params.delete("offset");
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, []);

  return [range, setRange] as const;
}
