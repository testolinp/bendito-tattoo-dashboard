"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getIncomeStats,
  type IncomeStats,
  type TurnoRow,
} from "@/lib/dashboard-actions";
import { formatDateTime } from "@/lib/datetime-utils";

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
    const end = new Date(nextSun);
    const label = `${sun.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} - ${new Date(nextSun.getTime() - 86400000).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}`;
    return { start: sun, end, label };
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
  n === 0
    ? "—"
    : n.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

// formatDateTime now imported from datetime-utils

export default function DashboardCards() {
  const [period, setPeriod] = useState<Period>("day");
  const [offset, setOffset] = useState(0);
  const [stats, setStats] = useState<IncomeStats | null>(null);
  const [viewing, setViewing] = useState<TurnoRow | null>(null);
  const viewModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewing) viewModalRef.current?.focus();
  }, [viewing]);

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
                  <p className="card-text h4 mb-0">
                    ${fmt(stats.totalCotizacion)}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-bg-primary">
                <div className="card-body">
                  <h6 className="card-title mb-0">Pesos</h6>
                  <p className="card-text h4 mb-0">
                    ${fmt(stats.totalDepPesos + stats.totalPagPesos)}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-bg-success">
                <div className="card-body">
                  <h6 className="card-title mb-0">USD</h6>
                  <p className="card-text h4 mb-0">
                    ${fmt(stats.totalDepUsd + stats.totalPagUsd)}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-bg-warning">
                <div className="card-body">
                  <h6 className="card-title mb-0">Euros</h6>
                  <p className="card-text h4 mb-0">
                    €{fmt(stats.totalDepEuros + stats.totalPagEuros)}
                  </p>
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
                      <th>Acción</th>
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
                          ${fmt(t.cotizacion)}{" "}
                          {t.moneda === "Pesos" ? "$" : t.moneda}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => setViewing(t)}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {stats.staffCommissions.length > 0 && (
            <div className="card mb-3">
              <div className="card-header">Comisiones</div>
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Nombre</th>
                      <th>Rol</th>
                      <th>%</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.staffCommissions.map((s, i) => (
                      <tr key={i}>
                        <td>{s.name}</td>
                        <td>{s.role}</td>
                        <td>{s.pct}%</td>
                        <td>${fmt(s.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td className="fw-bold">Total cotizado</td>
                      <td></td>
                      <td></td>
                      <td className="fw-bold">${fmt(stats.totalCotPesos)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="card mb-3">
            <div className="card-header">Tienda</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <h6 className="card-title mb-1">Pesos</h6>
                  <p className="h5 mb-0">${fmt(stats.totalShop)}</p>
                  <small className="text-muted">Restante de cotización en pesos</small>
                </div>
                <div className="col-md-4">
                  <h6 className="card-title mb-1">USD</h6>
                  <p className="h5 mb-0">${fmt(stats.totalDepUsd + stats.totalPagUsd)}</p>
                </div>
                <div className="col-md-4">
                  <h6 className="card-title mb-1">Euros</h6>
                  <p className="h5 mb-0">€{fmt(stats.totalDepEuros + stats.totalPagEuros)}</p>
                </div>
              </div>
            </div>
          </div>

          {viewing && (
            <div
              className="modal d-block"
              tabIndex={-1}
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              ref={viewModalRef}
              onKeyDown={(e) => {
                if (e.key === "Escape") setViewing(null);
              }}
            >
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Detalles del turno</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setViewing(null)}
                    />
                  </div>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label text-muted small">
                          Nombre
                        </label>
                        <div className="fw-semibold">{viewing.name}</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted small">
                          Teléfono
                        </label>
                        <div className="fw-semibold">{viewing.telefono || "-"}</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted small">
                          Fecha
                        </label>
                        <div className="fw-semibold">
                          {formatDateTime(viewing.fecha_cita)}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-muted small">
                          Gerente
                        </label>
                        <div className="fw-semibold">
                          {viewing.gerente_name}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-muted small">
                          Tatuador
                        </label>
                        <div className="fw-semibold">
                          {viewing.tatuador_name}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-muted small">
                          Jalador
                        </label>
                        <div className="fw-semibold">
                          {viewing.jalador_name}
                        </div>
                      </div>
                      <div className="col-12">
                        <hr className="my-2" />
                        <h6 className="fw-bold mb-2">Cotización</h6>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted small">
                          Cotización
                        </label>
                        <div className="fw-semibold">
                          ${fmt(viewing.cotizacion)}{" "}
                          {viewing.moneda === "Pesos" ? "$" : viewing.moneda}
                        </div>
                      </div>
                      <div className="col-md-6 d-flex align-items-end pb-1">
                        <div className="fw-semibold fs-4">
                          {(() => {
                            const q = Number(viewing.cotizacion);
                            const r =
                              viewing.moneda === "USD"
                                ? 16
                                : viewing.moneda === "Euros"
                                  ? 19
                                  : 1;
                            const qPesos = q * r;
                            const p =
                              Number(viewing.deposito_pesos || 0) +
                              Number(viewing.deposito_usd || 0) * 16 +
                              Number(viewing.deposito_euros || 0) * 19 +
                              Number(viewing.pago_pesos || 0) +
                              Number(viewing.pago_usd || 0) * 16 +
                              Number(viewing.pago_euros || 0) * 19;
                            const rem = Math.max(0, qPesos - p);
                            return `Falta pagar: $${rem.toFixed(2)}`;
                          })()}
                        </div>
                      </div>
                      {(Number(viewing.deposito_pesos || 0) > 0 ||
                        Number(viewing.deposito_usd || 0) > 0 ||
                        Number(viewing.deposito_euros || 0) > 0) && (
                        <>
                          <div className="col-12">
                            <hr className="my-2" />
                            <h6 className="fw-bold mb-2">Depósito</h6>
                          </div>
                          {Number(viewing.deposito_pesos || 0) > 0 && (
                            <div className="col-md-3">
                              <label className="form-label text-muted small">
                                Pesos
                              </label>
                              <div className="fw-semibold">
                                ${fmt(viewing.deposito_pesos)}
                              </div>
                            </div>
                          )}
                          {Number(viewing.deposito_usd || 0) > 0 && (
                            <div className="col-md-3">
                              <label className="form-label text-muted small">
                                USD
                              </label>
                              <div className="fw-semibold">
                                ${fmt(viewing.deposito_usd)}
                              </div>
                            </div>
                          )}
                          {Number(viewing.deposito_euros || 0) > 0 && (
                            <div className="col-md-3">
                              <label className="form-label text-muted small">
                                Euros
                              </label>
                              <div className="fw-semibold">
                                €{fmt(viewing.deposito_euros)}
                              </div>
                            </div>
                          )}
                          <div className="col-md-3">
                            <label className="form-label text-muted small">
                              Forma de pago
                            </label>
                            <div className="fw-semibold">
                              {viewing.forma_pago}
                            </div>
                          </div>
                        </>
                      )}
                      <div className="col-12">
                        <hr className="my-2" />
                        <h6 className="fw-bold mb-2">Pago</h6>
                      </div>
                      {Number(viewing.pago_pesos || 0) > 0 && (
                        <div className="col-md-3">
                          <label className="form-label text-muted small">
                            Pesos
                          </label>
                          <div className="fw-semibold">
                            ${fmt(viewing.pago_pesos)}
                          </div>
                        </div>
                      )}
                      {Number(viewing.pago_usd || 0) > 0 && (
                        <div className="col-md-3">
                          <label className="form-label text-muted small">
                            USD
                          </label>
                          <div className="fw-semibold">
                            ${fmt(viewing.pago_usd)}
                          </div>
                        </div>
                      )}
                      {Number(viewing.pago_euros || 0) > 0 && (
                        <div className="col-md-3">
                          <label className="form-label text-muted small">
                            Euros
                          </label>
                          <div className="fw-semibold">
                            €{fmt(viewing.pago_euros)}
                          </div>
                        </div>
                      )}
                      <div className="col-md-3">
                        <label className="form-label text-muted small">
                          Forma de pago
                        </label>
                        <div className="fw-semibold">
                          {viewing.pago_forma_pago}
                        </div>
                      </div>
                      <div className="col-12">
                        <hr className="my-2" />
                        <h6 className="fw-bold mb-2">Comisiones</h6>
                      </div>
                      {(() => {
                        const cotPesos = Number(viewing.cotizacion) * (viewing.moneda === "USD" ? 16 : viewing.moneda === "Euros" ? 19 : 1);
                        const pTat = Number(viewing.porcentaje_tatuador || 0);
                        const pJal = Number(viewing.porcentaje_jalador || 0);
                        const pGer = Number(viewing.porcentaje_gerente || 0);
                        const totalP = pTat + pJal + pGer;
                        const mTat = cotPesos * pTat / 100;
                        const mJal = cotPesos * pJal / 100;
                        const mGer = cotPesos * pGer / 100;
                        const shop = cotPesos - mTat - mJal - mGer;
                        return (
                          <>
                            <div className="col-md-3">
                              <label className="form-label text-muted small">Cotización en pesos</label>
                              <div className="fw-semibold">${cotPesos.toFixed(2)}</div>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label text-muted small">Tatuador ({pTat}%)</label>
                              <div className="fw-semibold">${mTat.toFixed(2)}</div>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label text-muted small">Jalador ({pJal}%)</label>
                              <div className="fw-semibold">${mJal.toFixed(2)}</div>
                            </div>
                            <div className="col-md-3">
                              <label className="form-label text-muted small">Gerente ({pGer}%)</label>
                              <div className="fw-semibold">${mGer.toFixed(2)}</div>
                            </div>
                            <div className="col-12">
                              <small className={shop >= 0 ? "text-success" : "text-danger"}>
                                Tienda: ${shop.toFixed(2)} ({Math.max(0, 100 - totalP)}%)
                              </small>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setViewing(null)}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
