"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import {
  getPaymentSummary,
  getConfirmedPayments,
  confirmPayment,
  undoConfirmPayment,
  type PaymentSummary,
  type PersonPayment,
} from "@/lib/pagos-actions";
import { rangeToISO } from "@/lib/datetime-utils";
import { useSharedDateRange } from "@/lib/date-range-store";
import PeriodFilter from "@/components/PeriodFilter";

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
  const [range, setRange] = useSharedDateRange();
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmedMap, setConfirmedMap] = useState<Map<string, string>>(new Map());
  const [confirmingPerson, setConfirmingPerson] = useState<{
    name: string;
    amount: number;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const modalRef = useRef<HTMLDivElement>(null);

  const { start: startISO, end: endISO } = rangeToISO(range);

  useEffect(() => {
    if (confirmingPerson) modalRef.current?.focus();
  }, [confirmingPerson]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [summaryData, confirmedPayments] = await Promise.all([
      getPaymentSummary(startISO, endISO),
      getConfirmedPayments(startISO, endISO),
    ]);
    setSummary(summaryData);
    setConfirmedMap(new Map(confirmedPayments.map((c) => [c.person_name, c.payment_method])));
    setLoading(false);
  }, [startISO, endISO]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirm = async () => {
    if (!confirmingPerson) return;
    try {
      await confirmPayment(
        confirmingPerson.name,
        startISO,
        confirmingPerson.amount,
        paymentMethod
      );
      const next = new Map(confirmedMap);
      next.set(confirmingPerson.name, paymentMethod);
      setConfirmedMap(next);
      setConfirmingPerson(null);
      setPaymentMethod("Efectivo");
    } catch (e: unknown) {
      alert("Error al confirmar pago: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleUndo = async (name: string) => {
    try {
      await undoConfirmPayment(name, startISO, endISO);
      const next = new Map(confirmedMap);
      next.delete(name);
      setConfirmedMap(next);
    } catch (e: unknown) {
      alert("Error al deshacer pago: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const openConfirm = (name: string, amount: number, cashOnly: boolean) => {
    setPaymentMethod(cashOnly ? "Efectivo" : "Deposito");
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
                    <option value="Deposito">Cuenta</option>
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Pagos</h2>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
          Imprimir
        </button>
      </div>

      <PeriodFilter range={range} onChange={setRange} />

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
