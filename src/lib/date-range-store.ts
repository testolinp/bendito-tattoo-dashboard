"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  businessToday,
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

function readUrl(): DateRange | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (
    !params.has("from") &&
    !params.has("to") &&
    !params.has("period") &&
    !params.has("offset")
  ) {
    return null;
  }
  return rangeFromParams(params);
}

function getSnapshot(): DateRange {
  if (!cache) cache = readUrl() ?? readLocal() ?? defaultRange();
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
  const range = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setRange = useCallback((next: DateRange) => setSharedRange(next), []);
  return [range, setRange] as const;
}
