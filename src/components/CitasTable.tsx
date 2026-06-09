"use client";

import { useState } from "react";
import {
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
} from "@/lib/appointments-actions";
import type { Appointment } from "@/lib/appointments-actions";
import type { StaffMember } from "@/lib/staff-actions";

type Props = {
  appointments: Appointment[];
  gerentes: StaffMember[];
  tatuadores: StaffMember[];
  jaladores: StaffMember[];
};

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  concretada: "Concretada",
  cancelada: "Cancelada",
};

const statusColors: Record<string, string> = {
  pendiente: "bg-warning text-dark",
  concretada: "bg-success",
  cancelada: "bg-danger",
};

export default function CitasTable({ appointments, gerentes, tatuadores, jaladores }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    setModalOpen(true);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const action = editing ? updateAppointment(formData) : createAppointment(formData);
    const result = await action;

    setSubmitting(false);

    if (result?.error) {
      alert(result.error);
    } else {
      setModalOpen(false);
    }
  }

  const handleCancel = async (id: number) => {
    if (!confirm("¿Cancelar esta cita?")) return;
    const result = await cancelAppointment(id);
    if (result?.error) alert(result.error);
  };

  const handleComplete = async (id: number) => {
    if (!confirm("¿Concretar esta cita?")) return;
    const result = await completeAppointment(id);
    if (result?.error) alert(result.error);
  };

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

  const toDateTimeLocal = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Citas</h2>
        <button className="btn btn-dark" onClick={openCreate}>
          + Nueva cita
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
                  {editing ? "Editar cita" : "Nueva cita"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalOpen(false)}
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
                            {g.name}
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
                            {t.name}
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
                            {j.name}
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
                        defaultValue={editing ? toDateTimeLocal(editing.fecha_cita) : ""}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-dark" disabled={submitting}>
                    {submitting ? "Guardando..." : editing ? "Guardar cambios" : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="card">
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
                <th>Estado</th>
                <th style={{ width: 180 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-muted py-4">
                    No hay citas registradas
                  </td>
                </tr>
              )}
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.gerente_name}</td>
                  <td>{a.tatuador_name}</td>
                  <td>{a.jalador_name}</td>
                  <td>
                    {Number(a.cotizacion).toFixed(2)} {a.moneda === "Pesos" ? "$" : a.moneda}
                  </td>
                  <td>${Number(a.deposito_pesos || 0).toFixed(2)}</td>
                  <td>${Number(a.deposito_usd || 0).toFixed(2)}</td>
                  <td>${Number(a.deposito_euros || 0).toFixed(2)}</td>
                  <td>{a.forma_pago}</td>
                  <td>{formatDateTime(a.fecha_cita)}</td>
                  <td>
                    <span className={`badge ${statusColors[a.status] || "bg-secondary"}`}>
                      {statusLabels[a.status] || a.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-secondary me-1"
                      onClick={() => openEdit(a)}
                    >
                      Editar
                    </button>
                    {a.status === "pendiente" && (
                      <>
                        <button
                          className="btn btn-sm btn-outline-success me-1"
                          onClick={() => handleComplete(a.id)}
                        >
                          Concretar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleCancel(a.id)}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
