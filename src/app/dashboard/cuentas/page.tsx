"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import {
  getCuentasSummary,
  type CuentasSummary,
  type CurrencyBreakdown,
} from "@/lib/cuentas-actions";
import { createEgreso, updateEgreso, deleteEgreso, type Egreso } from "@/lib/egresos-actions";
import { businessToday, rangeToISO } from "@/lib/datetime-utils";
import { useSharedDateRange } from "@/lib/date-range-store";
import ConfirmDialog from "@/components/ConfirmDialog";
import PeriodFilter from "@/components/PeriodFilter";

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
      <td className="text-end">${fmt(data.cuenta)}</td>
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
  const [range, setRange] = useSharedDateRange();
  const [summary, setSummary] = useState<CuentasSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEgresoModal, setShowEgresoModal] = useState(false);
  const [egresoAmount, setEgresoAmount] = useState("");
  const [egresoMethod, setEgresoMethod] = useState("Efectivo");
  const [egresoDescription, setEgresoDescription] = useState("");
  const [egresoDate, setEgresoDate] = useState(() => businessToday());
  const [editingEgreso, setEditingEgreso] = useState<Egreso | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Egreso | null>(null);
  const egresoModalRef = useRef<HTMLDivElement>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const { start, end } = rangeToISO(range);
    const data = await getCuentasSummary(start, end);
    setSummary(data);
    setLoading(false);
  }, [range]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async al cambiar el periodo
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (showEgresoModal) egresoModalRef.current?.focus();
  }, [showEgresoModal]);

  const resetEgresoForm = () => {
    setEgresoAmount("");
    setEgresoMethod("Efectivo");
    setEgresoDescription("");
    setEgresoDate(businessToday());
    setEditingEgreso(null);
  };

  const handleCreateEgreso = async () => {
    const amount = Number(egresoAmount);
    if (!amount || amount <= 0) return;
    const formData = new FormData();
    formData.set("amount", String(amount));
    formData.set("payment_method", egresoMethod);
    formData.set("description", egresoDescription);
    formData.set("date", egresoDate);
    const result = await createEgreso(formData);
    if (result?.error) {
      alert("Error al guardar egreso: " + result.error);
      return;
    }
    setShowEgresoModal(false);
    resetEgresoForm();
    fetchSummary();
  };

  const handleUpdateEgreso = async () => {
    if (!editingEgreso) return;
    const amount = Number(egresoAmount);
    if (!amount || amount <= 0) return;
    const formData = new FormData();
    formData.set("id", String(editingEgreso.id));
    formData.set("amount", String(amount));
    formData.set("payment_method", egresoMethod);
    formData.set("description", egresoDescription);
    formData.set("date", egresoDate);
    const result = await updateEgreso(formData);
    if (result?.error) {
      alert("Error al actualizar egreso: " + result.error);
      return;
    }
    setShowEgresoModal(false);
    resetEgresoForm();
    fetchSummary();
  };

  const handleDeleteEgreso = async () => {
    if (!deleteConfirm) return;
    const result = await deleteEgreso(deleteConfirm.id);
    if (result?.error) {
      alert("Error al eliminar egreso: " + result.error);
      return;
    }
    setDeleteConfirm(null);
    fetchSummary();
  };

  const openEditEgreso = (eg: Egreso) => {
    setEditingEgreso(eg);
    setEgresoAmount(String(eg.amount));
    setEgresoMethod(eg.payment_method);
    setEgresoDescription(eg.description);
    setEgresoDate(eg.date);
    setShowEgresoModal(true);
  };

  const openNewEgreso = () => {
    resetEgresoForm();
    setShowEgresoModal(true);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Cuentas</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-dark" onClick={openNewEgreso}>
            + Nuevo egreso
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
      </div>

      <PeriodFilter range={range} onChange={setRange} />

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
                    <th className="text-end">Cuenta</th>
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

          {/* Egresos modal */}
          {showEgresoModal && (
            <div
              className="modal d-block"
              tabIndex={-1}
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              ref={egresoModalRef}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowEgresoModal(false);
              }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{editingEgreso ? "Editar egreso" : "Nuevo egreso"}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowEgresoModal(false)} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={egresoDate}
                        onChange={(e) => setEgresoDate(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Monto</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={egresoAmount}
                        onChange={(e) => setEgresoAmount(e.target.value)}
                        placeholder="0.00"
                        autoFocus
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Método de pago</label>
                      <select className="form-select" value={egresoMethod} onChange={(e) => setEgresoMethod(e.target.value)}>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Deposito">Cuenta</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Descripción</label>
                      <input
                        type="text"
                        className="form-control"
                        value={egresoDescription}
                        onChange={(e) => setEgresoDescription(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEgresoModal(false)}>
                      Cancelar
                    </button>
                    <button type="button" className="btn btn-dark" onClick={editingEgreso ? handleUpdateEgreso : handleCreateEgreso}>
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Egresos */}
          <div className="card mb-3">
            <div className="card-header fw-bold d-flex justify-content-between align-items-center">
              <span>Egresos</span>
              {summary.egresos.length > 0 && (
                <span className="fw-bold">${fmt(summary.egresos.reduce((s, e) => s + e.amount, 0))}</span>
              )}
            </div>
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Método</th>
                    <th className="text-end">Monto</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.egresos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">Sin egresos</td>
                    </tr>
                  ) : (
                    summary.egresos.map((eg) => (
                      <tr key={eg.id}>
                        <td>{eg.date ? new Date(eg.date + "T12:00:00").toLocaleDateString("es-MX") : "—"}</td>
                        <td>{eg.description || "—"}</td>
                        <td>{eg.payment_method}</td>
                        <td className="text-end">${fmt(eg.amount)}</td>
                        <td className="text-nowrap text-end">
                          <button className="btn btn-sm btn-outline-secondary py-0 px-1 me-1" onClick={() => openEditEgreso(eg)} title="Editar">
✎
                          </button>
                          <button className="btn btn-sm btn-outline-danger py-0 px-1" onClick={() => setDeleteConfirm(eg)} title="Eliminar">
✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <ConfirmDialog
            open={deleteConfirm !== null}
            title="Eliminar egreso"
            message={`¿Eliminar egreso de $${fmt(deleteConfirm?.amount ?? 0)}?`}
            confirmLabel="Eliminar"
            variant="danger"
            onConfirm={handleDeleteEgreso}
            onCancel={() => setDeleteConfirm(null)}
          />

          {/* Tienda */}
          <div className="card mb-3">
            <div className="card-header fw-bold">Tienda</div>
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Moneda</th>
                    <th className="text-end">Efectivo</th>
                    <th className="text-end">Cuenta</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <BreakdownRow label="Pesos" data={summary.tienda.pesos} />
                  <BreakdownRow label="USD" data={summary.tienda.usd} />
                  <BreakdownRow label="Euros" data={summary.tienda.euros} />
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td className="fw-bold">Total tienda (en pesos)</td>
                    <td className="text-end fw-bold">
                      ${fmt(summary.tienda.pesos.efectivo + summary.tienda.usd.efectivo * 16 + summary.tienda.euros.efectivo * 19)}
                    </td>
                    <td className="text-end fw-bold">
                      ${fmt(summary.tienda.pesos.cuenta + summary.tienda.usd.cuenta * 16 + summary.tienda.euros.cuenta * 19)}
                    </td>
                    <td className="text-end fw-bold">
                      ${fmt(summary.tienda.pesos.total + summary.tienda.usd.total * 16 + summary.tienda.euros.total * 19)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Totales */}
          <div className="card border-dark">
            <div className="card-header fw-bold bg-dark text-white">Totales (Tienda - Egresos)</div>
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Moneda</th>
                    <th className="text-end">Efectivo</th>
                    <th className="text-end">Cuenta</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <BreakdownRow label="Pesos" data={summary.totales.pesos} />
                  <BreakdownRow label="USD" data={summary.totales.usd} />
                  <BreakdownRow label="Euros" data={summary.totales.euros} />
                </tbody>
                <tfoot className="table-dark">
                  <tr>
                    <td className="fw-bold">Total final (en pesos)</td>
                    <td className="text-end fw-bold">
                      ${fmt(summary.totales.pesos.efectivo + summary.totales.usd.efectivo * 16 + summary.totales.euros.efectivo * 19)}
                    </td>
                    <td className="text-end fw-bold">
                      ${fmt(summary.totales.pesos.cuenta + summary.totales.usd.cuenta * 16 + summary.totales.euros.cuenta * 19)}
                    </td>
                    <td className="text-end fw-bold">
                      ${fmt(summary.totales.pesos.total + summary.totales.usd.total * 16 + summary.totales.euros.total * 19)}
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
