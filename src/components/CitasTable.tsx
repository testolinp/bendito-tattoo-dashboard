"use client";

import { useState } from "react";
import { createAppointment, deleteAppointment } from "@/lib/appointments-actions";
import type { Appointment } from "@/lib/appointments-actions";
import type { StaffMember } from "@/lib/staff-actions";

type Props = {
  appointments: Appointment[];
  gerentes: StaffMember[];
  tatuadores: StaffMember[];
};

export default function CitasTable({ appointments, gerentes, tatuadores }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createAppointment(formData);

    if (result?.error) {
      alert(result.error);
    } else {
      setModalOpen(false);
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta cita?")) return;
    const result = await deleteAppointment(id);
    if (result?.error) alert(result.error);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Citas</h2>
        <button className="btn btn-dark" onClick={() => setModalOpen(true)}>
          + Nueva cita
        </button>
      </div>

      {modalOpen && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nueva cita</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalOpen(false)}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input name="name" type="text" className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Gerente</label>
                    <select name="gerente_id" className="form-select" required>
                      <option value="">Seleccionar gerente</option>
                      {gerentes.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tatuador</label>
                    <select name="tatuador_id" className="form-select" required>
                      <option value="">Seleccionar tatuador</option>
                      {tatuadores.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Depósito</label>
                    <input
                      name="deposito"
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Forma de pago</label>
                    <select name="forma_pago" className="form-select" required>
                      <option value="">Seleccionar</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Deposito">Depósito</option>
                      <option value="Tarjeta">Tarjeta</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fecha de pago</label>
                    <input name="fecha_pago" type="date" className="form-control" required />
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
                  <button type="submit" className="btn btn-dark">
                    Guardar
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
                <th>Depósito</th>
                <th>Forma de pago</th>
                <th>Fecha de pago</th>
                <th style={{ width: 100 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No hay citas registradas
                  </td>
                </tr>
              )}
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.gerente_name}</td>
                  <td>{a.tatuador_name}</td>
                  <td>${Number(a.deposito).toFixed(2)}</td>
                  <td>{a.forma_pago}</td>
                  <td>{a.fecha_pago}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(a.id)}
                    >
                      Eliminar
                    </button>
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
