"use client";

import { useState, useEffect } from "react";
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
  const [submitting, setSubmitting] = useState(false);
  const [pastPage, setPastPage] = useState(0);

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
        setModalOpen(true);
      }
    }
  }, [editTurnoId, turnos]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (t: Turno) => {
    setEditing(t);
    setModalOpen(true);
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
                      <label className="form-label">Cotización</label>
                      <div className="input-group">
                        <input
                          name="cotizacion"
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          defaultValue={editing?.cotizacion ?? ""}
                          required
                        />
                        <select
                          name="moneda"
                          className="form-select"
                          style={{ maxWidth: 110 }}
                          defaultValue={editing?.moneda ?? "Pesos"}
                          required
                        >
                          <option value="Pesos">Pesos</option>
                          <option value="USD">USD</option>
                          <option value="Euros">Euros</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Forma de pago</label>
                      <select
                        name="forma_pago"
                        className="form-select"
                        defaultValue={editing?.forma_pago ?? ""}
                        required
                      >
                        <option value="">Seleccionar</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Deposito">Depósito</option>
                        <option value="Tarjeta">Tarjeta</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label mb-2">Depósito</label>
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
                              defaultValue={editing?.deposito_pesos ?? ""}
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
                              defaultValue={editing?.deposito_usd ?? ""}
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
                              defaultValue={editing?.deposito_euros ?? ""}
                            />
                          </div>
                        </div>
                      </div>
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
                <th>Dep. Pesos</th>
                <th>Dep. USD</th>
                <th>Dep. Euros</th>
                <th>Forma de pago</th>
                <th>Fecha de cita</th>
                <th style={{ width: 100 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {upcomingTurnos.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center text-muted py-4">
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
                  <td>${Number(t.deposito_pesos || 0).toFixed(2)}</td>
                  <td>${Number(t.deposito_usd || 0).toFixed(2)}</td>
                  <td>${Number(t.deposito_euros || 0).toFixed(2)}</td>
                  <td>{t.forma_pago}</td>
                  <td>{formatDateTime(t.fecha_cita)}</td>
                  <td>
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
                <th>Dep. Pesos</th>
                <th>Dep. USD</th>
                <th>Dep. Euros</th>
                <th>Forma de pago</th>
                <th>Fecha de cita</th>
                <th style={{ width: 100 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pastSlice.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center text-muted py-4">
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
                  <td>${Number(t.deposito_pesos || 0).toFixed(2)}</td>
                  <td>${Number(t.deposito_usd || 0).toFixed(2)}</td>
                  <td>${Number(t.deposito_euros || 0).toFixed(2)}</td>
                  <td>{t.forma_pago}</td>
                  <td>{formatDateTime(t.fecha_cita)}</td>
                  <td>
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
