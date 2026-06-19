"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  getPaymentSummary,
  getConfirmedPayments,
  confirmPayment,
  undoConfirmPayment,
  type PaymentSummary,
  type PersonPayment,
} from "@/lib/pagos-actions";

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

function PersonRow({
  person,
  paymentMethod,
  onConfirm,
  onUndo,
}: {
  person: PersonPayment;
  paymentMethod: string | null;
  onConfirm: () => void;
  onUndo: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className={paymentMethod ? "table-success" : ""}>
        <td>{person.name}</td>
        <td>${fmt(person.total)}</td>
        <td>
          {paymentMethod ? (
            <span className="text-success fw-semibold small">
              Pagado ({paymentMethod})
            </span>
          ) : (
            <>
              <button className="btn btn-sm btn-dark d-print-none" onClick={onConfirm}>
                Confirmar pago
              </button>
              <span className="text-muted small d-none d-print-inline">Pendiente</span>
            </>
          )}
        </td>
        <td className="text-end d-print-none" style={{ minWidth: 80 }}>
          {paymentMethod ? (
            <button
              className="btn btn-sm btn-outline-success me-1"
              onClick={onUndo}
              title="Deshacer"
            >
              ↩
            </button>
          ) : null}
          <button
            className="btn btn-sm btn-outline-secondary d-print-none"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "▴" : "▾"}
          </button>
        </td>
      </tr>
      {person.roles.map((r, i) => (
        <tr key={i} className={`table-light ${expanded ? "" : "d-none"} d-print-table-row`}>
          <td className="ps-4 text-muted">{r.role}</td>
          <td className="text-muted">${fmt(r.amount)}</td>
          <td colSpan={2} />
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
  const initialPeriodRaw = searchParams.get("period");
  const initialPeriod: Period = initialPeriodRaw === "week" || initialPeriodRaw === "month" ? initialPeriodRaw : "week";
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [offset, setOffset] = useState(0);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmedMap, setConfirmedMap] = useState<Map<string, string>>(new Map());
  const [confirmingPerson, setConfirmingPerson] = useState<{
    name: string;
    amount: number;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const modalRef = useRef<HTMLDivElement>(null);

  const { start, end, label } = getDateRange(period, offset);
  const startISO = start.toISOString();
  const endISO = end.toISOString();
  const periodStart = startISO;

  useEffect(() => {
    if (confirmingPerson) modalRef.current?.focus();
  }, [confirmingPerson]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [summaryData, confirmedPayments] = await Promise.all([
      getPaymentSummary(startISO, endISO),
      getConfirmedPayments(periodStart),
    ]);
    setSummary(summaryData);
    setConfirmedMap(new Map(confirmedPayments.map((c) => [c.person_name, c.payment_method])));
    setLoading(false);
  }, [startISO, endISO, periodStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirm = async () => {
    if (!confirmingPerson) return;
    await confirmPayment(
      confirmingPerson.name,
      periodStart,
      confirmingPerson.amount,
      paymentMethod
    );
    const next = new Map(confirmedMap);
    next.set(confirmingPerson.name, paymentMethod);
    setConfirmedMap(next);
    setConfirmingPerson(null);
    setPaymentMethod("Efectivo");
  };

  const handleUndo = async (name: string) => {
    await undoConfirmPayment(name, periodStart);
    const next = new Map(confirmedMap);
    next.delete(name);
    setConfirmedMap(next);
  };

  const openConfirm = (name: string, amount: number, cashOnly: boolean) => {
    setPaymentMethod(cashOnly ? "Efectivo" : "Depósito");
    setConfirmingPerson({ name, amount });
  };

  return (
    <div>
      {/* Confirm modal */}
      {confirmingPerson && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          ref={modalRef}
          onKeyDown={(e) => {
            if (e.key === "Escape") setConfirmingPerson(null);
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar pago</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setConfirmingPerson(null)}
                />
              </div>
              <div className="modal-body">
                <p>
                  ¿Confirmar pago de <strong>${fmt(confirmingPerson.amount)}</strong> a{" "}
                  <strong>{confirmingPerson.name}</strong>?
                </p>
                <div className="mb-3">
                  <label className="form-label">Método de pago</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Depósito">Depósito</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmingPerson(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={handleConfirm}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .table .d-print-table-row { display: table-row !important; }
        }
      `}</style>
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
                  <th>Estado</th>
                  <th className="text-end d-print-none">Acción</th>
                </tr>
              </thead>
              <tbody>
                {summary.people.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-3">
                      Sin datos para el período seleccionado
                    </td>
                  </tr>
                ) : (
                  summary.people.map((p, i) => (
                    <PersonRow
                      key={i}
                      person={p}
                      paymentMethod={confirmedMap.get(p.name) ?? null}
                      onConfirm={() => openConfirm(p.name, p.total, p.cashOnly)}
                      onUndo={() => handleUndo(p.name)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
