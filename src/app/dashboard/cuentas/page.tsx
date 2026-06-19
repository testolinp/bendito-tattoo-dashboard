"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getCuentasSummary,
  type CuentasSummary,
  type CurrencyBreakdown,
} from "@/lib/cuentas-actions";

type Period = "week" | "month";

const periodLabels: Record<Period, string> = {
  week: "Semana",
  month: "Mes",
};

function getDateRange(period: Period, offset: number) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

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

  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = new Date(d);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const label = d.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
  return { start, end, label };
}

const fmt = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function BreakdownRow({ label, data }: { label: string; data: CurrencyBreakdown }) {
  return (
    <tr>
      <td>{label}</td>
      <td className="text-end">${fmt(data.efectivo)}</td>
      <td className="text-end">${fmt(data.deposito)}</td>
      <td className="text-end">${fmt(data.tarjeta)}</td>
      <td className="text-end fw-bold">${fmt(data.total)}</td>
    </tr>
  );
}

export default function CuentasPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted">Cargando...</div>}>
      <CuentasContent />
    </Suspense>
  );
}

function CuentasContent() {
  const searchParams = useSearchParams();
  const periodParam = searchParams.get("period");
  const offsetParam = searchParams.get("offset");
  const initialPeriod: Period =
    periodParam === "week" || periodParam === "month" ? periodParam : "week";
  const initialOffset = offsetParam ? parseInt(offsetParam, 10) : 0;

  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [offset, setOffset] = useState(initialOffset);
  const [summary, setSummary] = useState<CuentasSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("period", period);
    params.set("offset", String(offset));
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [period, offset]);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange(period, offset);
    const data = await getCuentasSummary(
      start.toISOString(),
      end.toISOString()
    );
    setSummary(data);
    setLoading(false);
  }, [period, offset]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const { label } = getDateRange(period, offset);

  return (
    <div>
      <h2 className="mb-4">Cuentas</h2>

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
        <div className="d-flex gap-2 ms-auto">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "calc(100vh - 12rem)" }}>
          <div className="spinner-border text-dark" style={{ width: "3rem", height: "3rem" }} role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : summary ? (
        <>
          {/* Ingresos */}
          <div className="card mb-3">
            <div className="card-header fw-bold">Ingresos</div>
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Moneda</th>
                    <th className="text-end">Efectivo</th>
                    <th className="text-end">Depósito</th>
                    <th className="text-end">Tarjeta</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <BreakdownRow label="Pesos" data={summary.ingresos.pesos} />
                  <BreakdownRow label="USD" data={summary.ingresos.usd} />
                  <BreakdownRow label="Euros" data={summary.ingresos.euros} />
                </tbody>
              </table>
            </div>
          </div>

          {/* Comisiones */}
          <div className="card mb-3">
            <div className="card-header fw-bold">Comisiones pagadas</div>
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Rol</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Tatuador</td>
                    <td className="text-end">${fmt(summary.comisiones.tatuador)}</td>
                  </tr>
                  <tr>
                    <td>Jalador</td>
                    <td className="text-end">${fmt(summary.comisiones.jalador)}</td>
                  </tr>
                  <tr>
                    <td>Gerente</td>
                    <td className="text-end">${fmt(summary.comisiones.gerente)}</td>
                  </tr>
                  <tr className="table-light fw-bold">
                    <td>Total</td>
                    <td className="text-end">${fmt(summary.comisiones.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tienda */}
          <div className="card">
            <div className="card-header fw-bold">Tienda</div>
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Moneda</th>
                    <th className="text-end">Efectivo</th>
                    <th className="text-end">Depósito</th>
                    <th className="text-end">Tarjeta</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Pesos</td>
                    <td className="text-end">—</td>
                    <td className="text-end">—</td>
                    <td className="text-end">—</td>
                    <td className="text-end fw-bold">
                      ${fmt(summary.tienda.pesos)}
                    </td>
                  </tr>
                  <BreakdownRow label="USD" data={summary.tienda.usd} />
                  <BreakdownRow label="Euros" data={summary.tienda.euros} />
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td className="fw-bold">Total tienda</td>
                    <td className="text-end fw-bold">
                      ${fmt(summary.tienda.usd.efectivo + summary.tienda.euros.efectivo)}
                    </td>
                    <td className="text-end fw-bold">
                      ${fmt(summary.tienda.usd.deposito + summary.tienda.euros.deposito)}
                    </td>
                    <td className="text-end fw-bold">
                      ${fmt(summary.tienda.usd.tarjeta + summary.tienda.euros.tarjeta)}
                    </td>
                    <td className="text-end fw-bold">
                      ${fmt(summary.tienda.pesos + summary.tienda.usd.total + summary.tienda.euros.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
