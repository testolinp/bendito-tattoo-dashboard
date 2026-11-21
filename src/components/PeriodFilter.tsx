"use client";

import { useEffect, useId } from "react";
import {
  businessToday,
  isDateString,
  rangeLabel,
  yearRange,
  type DateRange,
} from "@/lib/datetime-utils";

export default function PeriodFilter({
  range,
  onChange,
}: {
  range: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const id = useId();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("from", range.from);
    params.set("to", range.to);
    params.delete("period");
    params.delete("offset");
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [range]);

  const update = (next: DateRange) => {
    if (
      isDateString(next.from) &&
      isDateString(next.to) &&
      next.from <= next.to
    ) {
      onChange(next);
    }
  };

  const today = businessToday();
  const currentYear = Number(today.slice(0, 4));
  const presets = [
    { text: "Hoy", range: { from: today, to: today } },
    { text: "Este año", range: yearRange(currentYear) },
    { text: "Año pasado", range: yearRange(currentYear - 1) },
  ];

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
      <div className="d-flex align-items-center gap-2">
        <label className="small text-muted mb-0" htmlFor={`${id}-from`}>
          Desde
        </label>
        <input
          id={`${id}-from`}
          type="date"
          className="form-control form-control-sm"
          style={{ width: "auto", minWidth: 130 }}
          value={range.from}
          max={range.to || undefined}
          onChange={(e) => update({ ...range, from: e.target.value })}
        />
        <label className="small text-muted mb-0" htmlFor={`${id}-to`}>
          Hasta
        </label>
        <input
          id={`${id}-to`}
          type="date"
          className="form-control form-control-sm"
          style={{ width: "auto", minWidth: 130 }}
          value={range.to}
          min={range.from || undefined}
          onChange={(e) => update({ ...range, to: e.target.value })}
        />
      </div>
      <span
        className="fw-semibold text-capitalize"
        style={{ minWidth: 160, textAlign: "center" }}
      >
        {rangeLabel(range)}
      </span>
      <div className="btn-group ms-auto" role="group">
        {presets.map((preset) => (
          <button
            key={preset.text}
            type="button"
            className={`btn btn-sm ${
              range.from === preset.range.from && range.to === preset.range.to
                ? "btn-dark"
                : "btn-outline-dark"
            }`}
            onClick={() => update(preset.range)}
          >
            {preset.text}
          </button>
        ))}
      </div>
    </div>
  );
}
