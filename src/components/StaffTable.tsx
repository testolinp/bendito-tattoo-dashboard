"use client";

import { useState } from "react";
import { createStaff, updateStaff, deleteStaff } from "@/lib/staff-actions";
import type { StaffMember } from "@/lib/staff-actions";

type Props = {
  staff: StaffMember[];
  role: StaffMember["role"];
  title: string;
};

export default function StaffTable({ staff, role, title }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditing(member);
    setModalOpen(true);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("role", role);

    const action = editing ? updateStaff(formData) : createStaff(formData);
    const result = await action;

    if (result?.error) {
      alert(result.error);
    } else {
      setModalOpen(false);
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este registro?")) return;
    const result = await deleteStaff(id, role);
    if (result?.error) alert(result.error);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">{title}</h2>
        <button className="btn btn-dark" onClick={openCreate}>
          + Nuevo
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Apodo</th>
                <th>Banco</th>
                <th>Clabe</th>
                <th>Pago</th>
                <th style={{ width: 140 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No hay registros
                  </td>
                </tr>
              )}
              {staff.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.nickname}</td>
                  <td>{member.bank}</td>
                  <td>{member.account_number}</td>
                  <td>
                    {member.cash_only ? (
                      <span className="badge bg-success">Solo efectivo</span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-secondary me-1"
                      onClick={() => openEdit(member)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(member.id)}
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

      {modalOpen && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? "Editar" : "Nuevo"}</h5>
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
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      name="name"
                      type="text"
                      className="form-control"
                      defaultValue={editing?.name ?? ""}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Apodo</label>
                    <input
                      name="nickname"
                      type="text"
                      className="form-control"
                      defaultValue={editing?.nickname ?? ""}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Banco</label>
                    <input
                      name="bank"
                      type="text"
                      className="form-control"
                      defaultValue={editing?.bank ?? ""}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Clabe</label>
                    <input
                      name="account_number"
                      type="text"
                      className="form-control"
                      defaultValue={editing?.account_number ?? ""}
                    />
                  </div>
                  <div className="mb-3 form-check">
                    <input
                      name="cash_only"
                      type="checkbox"
                      className="form-check-input"
                      id="cashOnly"
                      defaultChecked={editing?.cash_only ?? false}
                    />
                    <label className="form-check-label" htmlFor="cashOnly">
                      Pago solo en efectivo
                    </label>
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
                    {editing ? "Guardar cambios" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
