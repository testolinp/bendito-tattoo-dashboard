"use client";

import { useState, useEffect, useCallback } from "react";
import { getIncomeStats, type IncomeStats } from "@/lib/dashboard-actions";

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
      label: d.toLocaleDateString("es-AR", {
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
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((day + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 7);
    const end = new Date(sun);
    const label = `${mon.toLocaleDateString("es-AR", { day: "numeric", month: "short" })} - ${new Date(sun.getTime() - 86400000).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}`;
    return { start: mon, end, label };
  }

  if (period === "month") {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const start = new Date(d);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    return { start, end, label };
  }

  return { start: now, end: now, label: "" };
}

const fmt = (n: number) =>
  n === 0
    ? "—"
    : n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDateTime = (d: string) => {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function DashboardCards() {
  const [period, setPeriod] = useState<Period>("day");
  const [offset, setOffset] = useState(0);
  const [stats, setStats] = useState<IncomeStats | null>(null);

  const fetchStats = useCallback(async () => {
    const { start, end } = getDateRange(period, offset);
    const data = await getIncomeStats(start.toISOString(), end.toISOString());
    setStats(data);
  }, [period, offset]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const { label } = getDateRange(period, offset);

  return (
    <>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <div className="btn-group" role="group">
          {(Object.entries(periodLabels) as [Period, string][]).map(([key, text]) => (
            <button
              key={key}
              className={`btn btn-sm ${period === key ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => { setPeriod(key); setOffset(0); }}
            >
              {text}
            </button>
          ))}
        </div>
        <div className="d-flex align-items-center gap-2 ms-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setOffset((o) => o - 1)}>◀</button>
          <span className="fw-semibold text-capitalize" style={{ minWidth: 160, textAlign: "center" }}>
            {label}
          </span>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setOffset((o) => o + 1)}>▶</button>
        </div>
      </div>

      {stats && (
        <>
          <div className="row g-3 mb-3">
            <div className="col-md-2">
              <div className="card text-bg-dark">
                <div className="card-body">
                  <h6 className="card-title mb-0">Turnos</h6>
                  <p className="card-text h4 mb-0">{stats.totalTurnos}</p>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-bg-info">
                <div className="card-body">
                  <h6 className="card-title mb-0">Cotización</h6>
                  <p className="card-text h4 mb-0">${fmt(stats.totalCotizacion)}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-bg-primary">
                <div className="card-body">
                  <h6 className="card-title mb-0">Pesos</h6>
                  <p className="card-text h4 mb-0">${fmt(stats.totalPesos)}</p>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-bg-success">
                <div className="card-body">
                  <h6 className="card-title mb-0">USD</h6>
                  <p className="card-text h4 mb-0">${fmt(stats.totalUsd)}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-bg-warning">
                <div className="card-body">
                  <h6 className="card-title mb-0">Euros</h6>
                  <p className="card-text h4 mb-0">€{fmt(stats.totalEuros)}</p>
                </div>
              </div>
            </div>
          </div>

          {stats.turnos.length > 0 && (
            <div className="card mb-3">
              <div className="card-header">Turnos</div>
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Gerente</th>
                      <th>Tatuador</th>
                      <th>Jalador</th>
                      <th>Cotización</th>
                      <th>Dep. Pesos</th>
                      <th>Dep. USD</th>
                      <th>Dep. Euros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.turnos.map((t) => (
                      <tr key={t.id}>
                        <td>{formatDateTime(t.fecha_cita)}</td>
                        <td>{t.name}</td>
                        <td>{t.gerente_name}</td>
                        <td>{t.tatuador_name}</td>
                        <td>{t.jalador_name}</td>
                        <td>
                          ${fmt(t.cotizacion)} {t.moneda === "Pesos" ? "$" : t.moneda}
                        </td>
                        <td>${fmt(t.deposito_pesos)}</td>
                        <td>${fmt(t.deposito_usd)}</td>
                        <td>€{fmt(t.deposito_euros)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
