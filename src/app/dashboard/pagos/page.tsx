"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getPaymentSummary,
  type PaymentSummary,
  type PersonPayment,
} from "@/lib/pagos-actions";

type Period = "day" | "week" | "month";

const periodLabels: Record<Period, string> = {
  day: "Hoy",
  week: "Semana",
  month: "Mes",
};

function getDateRange(period: Period, offset: number) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (period === "day") {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const start = new Date(d);
    const end = new Date(d);
    end.setDate(end.getDate() + 1);
    return {
      start,
      end,
      label: d.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
  }

  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() + offset * 7);
    const day = d.getDay();
    const sun = new Date(d);
    sun.setDate(d.getDate() - day);
    const nextSun = new Date(sun);
    nextSun.setDate(sun.getDate() + 7);
    const label = `${sun.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} - ${new Date(nextSun.getTime() - 86400000).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}`;
    return { start: sun, end: nextSun, label };
  }

  if (period === "month") {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const start = new Date(d);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = d.toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    });
    return { start, end, label };
  }

  return { start: now, end: now, label: "" };
}

const fmt = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function PersonRow({ person }: { person: PersonPayment }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr>
        <td>{person.name}</td>
        <td>${fmt(person.total)}</td>
        <td>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "▴" : "▾"}
          </button>
        </td>
      </tr>
      {expanded &&
        person.roles.map((r, i) => (
          <tr key={i} className="table-light">
            <td className="ps-4 text-muted">{r.role}</td>
            <td className="text-muted">${fmt(r.amount)}</td>
            <td />
          </tr>
        ))}
    </>
  );
}

export default function PagosPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted">Cargando...</div>}>
      <PagosContent />
    </Suspense>
  );
}

function PagosContent() {
  const searchParams = useSearchParams();
  const initialPeriod = (searchParams.get("period") as Period) || "day";
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [offset, setOffset] = useState(0);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);

  const fetchSummary = useCallback(async () => {
    const { start, end } = getDateRange(period, offset);
    const data = await getPaymentSummary(
      start.toISOString(),
      end.toISOString()
    );
    setSummary(data);
  }, [period, offset]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const { label } = getDateRange(period, offset);

  return (
    <div>
      <h2 className="mb-4">Pagos</h2>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <div className="btn-group" role="group">
          {(Object.entries(periodLabels) as [Period, string][]).map(
            ([key, text]) => (
              <button
                key={key}
                className={`btn btn-sm ${period === key ? "btn-dark" : "btn-outline-dark"}`}
                onClick={() => {
                  setPeriod(key);
                  setOffset(0);
                }}
              >
                {text}
              </button>
            ),
          )}
        </div>
        <div className="d-flex align-items-center gap-2 ms-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setOffset((o) => o - 1)}
          >
            ◀
          </button>
          <span
            className="fw-semibold text-capitalize"
            style={{ minWidth: 160, textAlign: "center" }}
          >
            {label}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setOffset((o) => o + 1)}
          >
            ▶
          </button>
        </div>
      </div>

      {summary && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span>Resumen por persona</span>
            <span className="fw-bold">Total: ${fmt(summary.totalPagado)}</span>
          </div>
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Total a pagar</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {summary.people.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-muted py-3">
                      Sin datos para el período seleccionado
                    </td>
                  </tr>
                ) : (
                  summary.people.map((p, i) => (
                    <PersonRow key={i} person={p} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
