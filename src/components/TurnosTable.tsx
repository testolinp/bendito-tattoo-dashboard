"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createTurno, updateTurno } from "@/lib/turnos-actions";
import type { Turno } from "@/lib/turnos-actions";
import type { StaffMember } from "@/lib/staff-actions";
import { naiveToISO, formatDateTime, toDateTimeLocal } from "@/lib/datetime-utils";

type Props = {
  turnos: Turno[];
  gerentes: StaffMember[];
  tatuadores: StaffMember[];
  jaladores: StaffMember[];
  editTurnoId?: number | null;
};
const PAGE_SIZE = 10;

function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  return (
    <div className="d-flex justify-content-center gap-1 py-2">
      <button
        className="btn btn-sm btn-outline-secondary"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
      >
        ◀
      </button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          className={`btn btn-sm ${i === page ? "btn-dark" : "btn-outline-secondary"}`}
          onClick={() => onChange(i)}
        >
          {i + 1}
        </button>
      ))}
      <button
        className="btn btn-sm btn-outline-secondary"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        ▶
      </button>
    </div>
  );
}

// formatDateTime and toDateTimeLocal now imported from datetime-utils

export default function TurnosTable({
  turnos,
  gerentes,
  tatuadores,
  jaladores,
  editTurnoId,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Turno | null>(null);
  const [viewing, setViewing] = useState<Turno | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pastPage, setPastPage] = useState(0);

  const [formCotizacion, setFormCotizacion] = useState("");
  const [formMoneda, setFormMoneda] = useState("Pesos");
  const [formDepPesos, setFormDepPesos] = useState("");
  const [formDepUsd, setFormDepUsd] = useState("");
  const [formDepEur, setFormDepEur] = useState("");
  const [formPagPesos, setFormPagPesos] = useState("");
  const [formPagUsd, setFormPagUsd] = useState("");
  const [formPagEur, setFormPagEur] = useState("");

  const editModalRef = useRef<HTMLDivElement>(null);
  const viewModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalOpen) editModalRef.current?.focus();
  }, [modalOpen]);

  useEffect(() => {
    if (viewing) viewModalRef.current?.focus();
  }, [viewing]);

  const currentDate = new Date();
  const upcomingTurnos = turnos.filter(
    (t) => new Date(t.fecha_cita) >= currentDate,
  );
  const pastTurnos = turnos.filter((t) => new Date(t.fecha_cita) < currentDate);
  const pastStart = pastPage * PAGE_SIZE;
  const pastSlice = pastTurnos.slice(pastStart, pastStart + PAGE_SIZE);
  const gerenteLabelById = new Map(
    gerentes.map((g) => [g.id, (g.nickname && g.nickname.trim()) || g.name]),
  );
  const tatuadorLabelById = new Map(
    tatuadores.map((t) => [t.id, (t.nickname && t.nickname.trim()) || t.name]),
  );
  const jaladorLabelById = new Map(
    jaladores.map((j) => [j.id, (j.nickname && j.nickname.trim()) || j.name]),
  );

  const closeModal = () => {
    setModalOpen(false);
    if (editTurnoId) router.replace(pathname);
  };

  useEffect(() => {
    if (editTurnoId) {
      const turno = turnos.find((t) => t.id === editTurnoId);
      if (turno) {
        setEditing(turno);
        setFormCotizacion(String(turno.cotizacion ?? ""));
        setFormMoneda(turno.moneda ?? "Pesos");
        setFormDepPesos(String(turno.deposito_pesos ?? ""));
        setFormDepUsd(String(turno.deposito_usd ?? ""));
        setFormDepEur(String(turno.deposito_euros ?? ""));
        setFormPagPesos(String(turno.pago_pesos ?? ""));
        setFormPagUsd(String(turno.pago_usd ?? ""));
        setFormPagEur(String(turno.pago_euros ?? ""));
        setModalOpen(true);
      }
    }
  }, [editTurnoId, turnos]);

  const openCreate = () => {
    setEditing(null);
    setFormCotizacion("");
    setFormMoneda("Pesos");
    setFormDepPesos("");
    setFormDepUsd("");
    setFormDepEur("");
    setFormPagPesos("");
    setFormPagUsd("");
    setFormPagEur("");
    setModalOpen(true);
  };

  const openEdit = (t: Turno) => {
    setEditing(t);
    setFormCotizacion(String(t.cotizacion ?? ""));
    setFormMoneda(t.moneda ?? "Pesos");
    setFormDepPesos(String(t.deposito_pesos ?? ""));
    setFormDepUsd(String(t.deposito_usd ?? ""));
    setFormDepEur(String(t.deposito_euros ?? ""));
    setFormPagPesos(String(t.pago_pesos ?? ""));
    setFormPagUsd(String(t.pago_usd ?? ""));
    setFormPagEur(String(t.pago_euros ?? ""));
    setModalOpen(true);
  };

  const openView = (t: Turno) => {
    setViewing(t);
  };

  const closeView = () => {
    setViewing(null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const fechaCita = formData.get("fecha_cita") as string;
    if (fechaCita) formData.set("fecha_cita", naiveToISO(fechaCita));

    const action = editing ? updateTurno(formData) : createTurno(formData);
    const result = await action;

    setSubmitting(false);

    if (result?.error) {
      alert(result.error);
    } else {
      closeModal();
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Turnos</h2>
        <button className="btn btn-dark" onClick={openCreate}>
          + Nuevo turno
        </button>
      </div>

      {modalOpen && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          ref={editModalRef}
          onKeyDown={(e) => { if (e.key === "Escape") closeModal(); }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editing ? "Editar turno" : "Nuevo turno"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {editing && (
                    <input type="hidden" name="id" value={editing.id} />
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nombre</label>
                      <input
                        name="name"
                        type="text"
                        className="form-control"
                        defaultValue={editing?.name ?? ""}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Gerente</label>
                      <select
                        name="gerente_id"
                        className="form-select"
                        defaultValue={editing?.gerente_id ?? ""}
                        required
                      >
                        <option value="">Seleccionar</option>
                        {gerentes.map((g) => (
                          <option key={g.id} value={g.id}>
                            {(g.nickname && g.nickname.trim()) || g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Tatuador</label>
                      <select
                        name="tatuador_id"
                        className="form-select"
                        defaultValue={editing?.tatuador_id ?? ""}
                        required
                      >
                        <option value="">Seleccionar</option>
                        {tatuadores.map((t) => (
                          <option key={t.id} value={t.id}>
                            {(t.nickname && t.nickname.trim()) || t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Jalador</label>
                      <select
                        name="jalador_id"
                        className="form-select"
                        defaultValue={editing?.jalador_id ?? ""}
                        required
                      >
                        <option value="">Seleccionar</option>
                        {jaladores.map((j) => (
                          <option key={j.id} value={j.id}>
                            {(j.nickname && j.nickname.trim()) || j.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Fecha de la cita</label>
                      <input
                        name="fecha_cita"
                        type="datetime-local"
                        className="form-control"
                        defaultValue={
                          editing ? toDateTimeLocal(editing.fecha_cita) : ""
                        }
                        required
                      />
                    </div>
                    {/* Cotización */}
                    <div className="col-12">
                      <hr className="my-2" />
                      <h6 className="fw-bold mb-2">Cotización</h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Cotización</label>
                      <div className="input-group">
                        <input
                          name="cotizacion"
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          value={formCotizacion}
                          onChange={(e) => setFormCotizacion(e.target.value)}
                          required
                        />
                        <select
                          name="moneda"
                          className="form-select"
                          style={{ maxWidth: 110 }}
                          value={formMoneda}
                          onChange={(e) => setFormMoneda(e.target.value)}
                          required
                        >
                          <option value="Pesos">Pesos</option>
                          <option value="USD">USD</option>
                          <option value="Euros">Euros</option>
                      </select>
                      {editing && <input type="hidden" name="forma_pago" value={editing.forma_pago} />}
                    </div>
                    </div>
                    <div className="col-md-6 d-flex align-items-end pb-1">
                      <div className="fw-semibold fs-4">
                        {(() => {
                          const q = Number(formCotizacion || 0);
                          const r = formMoneda === "USD" ? 16 : formMoneda === "Euros" ? 19 : 1;
                          const qPesos = q * r;
                          const p = Number(formDepPesos || 0) + Number(formDepUsd || 0) * 16 + Number(formDepEur || 0) * 19 + Number(formPagPesos || 0) + Number(formPagUsd || 0) * 16 + Number(formPagEur || 0) * 19;
                          const rem = Math.max(0, qPesos - p);
                          return `Falta pagar: $${rem.toFixed(2)}`;
                        })()}
                      </div>
                    </div>
                    {(!editing || Number(formDepPesos) > 0 || Number(formDepUsd) > 0 || Number(formDepEur) > 0) && (
                      <>
                        <div className="col-12">
                          <hr className="my-2" />
                          <h6 className="fw-bold mb-2">Depósito</h6>
                        </div>
                        <div className="col-12">
                          <div className="row g-2">
                            <div className="col-md-4">
                              <div className="input-group">
                                <span className="input-group-text">$</span>
                                <input
                                  name="deposito_pesos"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="form-control"
                                  placeholder="Pesos"
                                  value={formDepPesos}
                                  onChange={(e) => setFormDepPesos(e.target.value)}
                                  readOnly={!!editing}
                                  tabIndex={editing ? -1 : 0}
                                  style={editing ? { outline: "none", boxShadow: "none" } : undefined}
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="input-group">
                                <span className="input-group-text">USD</span>
                                <input
                                  name="deposito_usd"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="form-control"
                                  placeholder="USD"
                                  value={formDepUsd}
                                  onChange={(e) => setFormDepUsd(e.target.value)}
                                  readOnly={!!editing}
                                  tabIndex={editing ? -1 : 0}
                                  style={editing ? { outline: "none", boxShadow: "none" } : undefined}
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="input-group">
                                <span className="input-group-text">€</span>
                                <input
                                  name="deposito_euros"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="form-control"
                                  placeholder="Euros"
                                  value={formDepEur}
                                  onChange={(e) => setFormDepEur(e.target.value)}
                                  readOnly={!!editing}
                                  tabIndex={editing ? -1 : 0}
                                  style={editing ? { outline: "none", boxShadow: "none" } : undefined}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Forma de pago</label>
                          <select
                            name="forma_pago"
                            className="form-select"
                            defaultValue={editing?.forma_pago ?? ""}
                            required
                            disabled={!!editing}
                            tabIndex={editing ? -1 : 0}
                            style={editing ? { outline: "none", boxShadow: "none" } : undefined}
                          >
                            <option value="">Seleccionar</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Deposito">Depósito</option>
                            <option value="Tarjeta">Tarjeta</option>
                          </select>
                          {editing && <input type="hidden" name="forma_pago" value={editing.forma_pago} />}
                        </div>
                      </>
                    )}
                    {/* Pago */}
                    <div className="col-12">
                      <hr className="my-2" />
                      <h6 className="fw-bold mb-2">Pago</h6>
                    </div>
                    <div className="col-12">
                      <div className="row g-2">
                        <div className="col-md-4">
                          <div className="input-group">
                            <span className="input-group-text">$</span>
                            <input
                              name="pago_pesos"
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-control"
                              placeholder="Pesos"
                              value={formPagPesos}
                              onChange={(e) => setFormPagPesos(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="input-group">
                            <span className="input-group-text">USD</span>
                            <input
                              name="pago_usd"
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-control"
                              placeholder="USD"
                              value={formPagUsd}
                              onChange={(e) => setFormPagUsd(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="input-group">
                            <span className="input-group-text">€</span>
                            <input
                              name="pago_euros"
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-control"
                              placeholder="Euros"
                              value={formPagEur}
                              onChange={(e) => setFormPagEur(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Forma de pago</label>
                      <select
                        name="pago_forma_pago"
                        className="form-select"
                        defaultValue={editing?.pago_forma_pago ?? ""}
                        required
                      >
                        <option value="">Seleccionar</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Deposito">Depósito</option>
                        <option value="Tarjeta">Tarjeta</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-dark"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Guardando..."
                      : editing
                        ? "Guardar cambios"
                        : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          ref={viewModalRef}
          onKeyDown={(e) => { if (e.key === "Escape") closeView(); }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Turno</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeView}
                />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Nombre</label>
                    <div className="fw-semibold">{viewing.name}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Gerente</label>
                    <div className="fw-semibold">{gerenteLabelById.get(viewing.gerente_id) ?? viewing.gerente_name}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Tatuador</label>
                    <div className="fw-semibold">{tatuadorLabelById.get(viewing.tatuador_id) ?? viewing.tatuador_name}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Jalador</label>
                    <div className="fw-semibold">{jaladorLabelById.get(viewing.jalador_id) ?? viewing.jalador_name}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Fecha de la cita</label>
                    <div className="fw-semibold">{formatDateTime(viewing.fecha_cita)}</div>
                  </div>
                  <div className="col-12">
                    <hr className="my-2" />
                    <h6 className="fw-bold mb-2">Cotización</h6>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Cotización</label>
                    <div className="fw-semibold">
                      {Number(viewing.cotizacion).toFixed(2)}{" "}
                      {viewing.moneda === "Pesos" ? "$" : viewing.moneda}
                    </div>
                    <div className="mt-1 fw-semibold fs-4">
                      {(() => {
                        const q = Number(viewing.cotizacion);
                        const r = viewing.moneda === "USD" ? 16 : viewing.moneda === "Euros" ? 19 : 1;
                        const qPesos = q * r;
                        const p = Number(viewing.deposito_pesos || 0) + Number(viewing.deposito_usd || 0) * 16 + Number(viewing.deposito_euros || 0) * 19 + Number(viewing.pago_pesos || 0) + Number(viewing.pago_usd || 0) * 16 + Number(viewing.pago_euros || 0) * 19;
                        const rem = Math.max(0, qPesos - p);
                        return `Falta pagar: $${rem.toFixed(2)}`;
                      })()}
                    </div>
                  </div>
                  {(Number(viewing.deposito_pesos || 0) > 0 ||
                    Number(viewing.deposito_usd || 0) > 0 ||
                    Number(viewing.deposito_euros || 0) > 0) && (
                    <div className="col-12">
                      <hr className="my-2" />
                      <h6 className="fw-bold mb-2">Depósito</h6>
                    </div>
                  )}
                  {Number(viewing.deposito_pesos || 0) > 0 && (
                    <div className="col-md-3">
                      <label className="form-label text-muted small">Pesos</label>
                      <div className="fw-semibold">${Number(viewing.deposito_pesos).toFixed(2)}</div>
                    </div>
                  )}
                  {Number(viewing.deposito_usd || 0) > 0 && (
                    <div className="col-md-3">
                      <label className="form-label text-muted small">USD</label>
                      <div className="fw-semibold">${Number(viewing.deposito_usd).toFixed(2)}</div>
                    </div>
                  )}
                  {Number(viewing.deposito_euros || 0) > 0 && (
                    <div className="col-md-3">
                      <label className="form-label text-muted small">Euros</label>
                      <div className="fw-semibold">${Number(viewing.deposito_euros).toFixed(2)}</div>
                    </div>
                  )}
                  {(Number(viewing.deposito_pesos || 0) > 0 ||
                    Number(viewing.deposito_usd || 0) > 0 ||
                    Number(viewing.deposito_euros || 0) > 0) && (
                    <div className="col-md-3">
                      <label className="form-label text-muted small">Forma de pago</label>
                      <div className="fw-semibold">{viewing.forma_pago}</div>
                    </div>
                  )}
                  <div className="col-12">
                    <hr className="my-2" />
                    <h6 className="fw-bold mb-2">Pago</h6>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted small">Pesos</label>
                    <div className="fw-semibold">${Number(viewing.pago_pesos || 0).toFixed(2)}</div>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted small">USD</label>
                    <div className="fw-semibold">${Number(viewing.pago_usd || 0).toFixed(2)}</div>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted small">Euros</label>
                    <div className="fw-semibold">${Number(viewing.pago_euros || 0).toFixed(2)}</div>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted small">Forma de pago</label>
                    <div className="fw-semibold">{viewing.pago_forma_pago}</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeView}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span className="fw-semibold">Turnos actuales y próximos</span>
          <span className="text-muted small">
            {upcomingTurnos.length} registros
          </span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Gerente</th>
                <th>Tatuador</th>
                <th>Jalador</th>
                <th>Cotización</th>
                <th>Fecha de cita</th>
                <th style={{ width: 160 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {upcomingTurnos.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No hay turnos actuales o próximos
                  </td>
                </tr>
              )}
              {upcomingTurnos.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>
                    {gerenteLabelById.get(t.gerente_id) ?? t.gerente_name}
                  </td>
                  <td>
                    {tatuadorLabelById.get(t.tatuador_id) ?? t.tatuador_name}
                  </td>
                  <td>
                    {jaladorLabelById.get(t.jalador_id) ?? t.jalador_name}
                  </td>
                  <td>
                    {Number(t.cotizacion).toFixed(2)}{" "}
                    {t.moneda === "Pesos" ? "$" : t.moneda}
                  </td>
                  <td>{formatDateTime(t.fecha_cita)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-info me-1"
                      onClick={() => openView(t)}
                    >
                      Ver
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => openEdit(t)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span className="fw-semibold">Turnos anteriores</span>
          <span className="text-muted small">
            {pastTurnos.length} registros
          </span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Gerente</th>
                <th>Tatuador</th>
                <th>Jalador</th>
                <th>Cotización</th>
                <th>Fecha de cita</th>
                <th style={{ width: 160 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pastSlice.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No hay turnos anteriores
                  </td>
                </tr>
              )}
              {pastSlice.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.gerente_name}</td>
                  <td>
                    {tatuadorLabelById.get(t.tatuador_id) ?? t.tatuador_name}
                  </td>
                  <td>{t.jalador_name}</td>
                  <td>
                    {Number(t.cotizacion).toFixed(2)}{" "}
                    {t.moneda === "Pesos" ? "$" : t.moneda}
                  </td>
                  <td>{formatDateTime(t.fecha_cita)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-info me-1"
                      onClick={() => openView(t)}
                    >
                      Ver
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => openEdit(t)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={pastPage}
          total={pastTurnos.length}
          onChange={setPastPage}
        />
      </div>
    </>
  );
}
