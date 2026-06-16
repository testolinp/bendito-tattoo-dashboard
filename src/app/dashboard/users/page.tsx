"use client";

import { useEffect, useState } from "react";
import { createUser, listUsers, updateUser, deleteUser, type AdminUser } from "@/lib/admin-actions";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  const loadUsers = async () => {
    try {
      const list = await listUsers();
      setUsers(list);
    } catch {
      setError("Error al cargar usuarios");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError("Email y contraseña son requeridos");
      return;
    }
    try {
      await createUser(email, password, isAdmin);
      setEmail("");
      setPassword("");
      setIsAdmin(false);
      setSuccess("Usuario creado exitosamente");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear usuario");
    }
  };

  const handleUpdate = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      await updateUser(id, { email: editEmail, isAdmin: editIsAdmin });
      setEditing(null);
      setSuccess("Usuario actualizado exitosamente");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar usuario");
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`¿Eliminar usuario "${email}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteUser(id, email);
      setSuccess("Usuario eliminado exitosamente");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar usuario");
    }
  };

  return (
    <div>
      <h2 className="mb-4">Usuarios</h2>

      {error && <div className="alert alert-danger py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}

      {/* Create form */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Crear usuario</h5>
          <form onSubmit={handleCreate}>
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Email / Usuario</label>
                <input
                  type="text"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="col-md-2">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isAdmin"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="isAdmin">
                    Admin
                  </label>
                </div>
              </div>
              <div className="col-md-3">
                <button type="submit" className="btn btn-dark w-100">
                  Crear usuario
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Users list */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Lista de usuarios</h5>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Admin</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    {editing?.id === u.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={editIsAdmin}
                            onChange={(e) => setEditIsAdmin(e.target.checked)}
                          />
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button
                            className="btn btn-sm btn-success me-1"
                            onClick={() => handleUpdate(u.id)}
                          >
                            Guardar
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditing(null)}
                          >
                            Cancelar
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{u.email}</td>
                        <td>{u.isAdmin ? "Sí" : "No"}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => {
                              setEditing(u);
                              setEditEmail(u.email);
                              setEditIsAdmin(u.isAdmin);
                            }}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={u.email === "admin@benditotattoo.com"}
                            onClick={() => handleDelete(u.id, u.email)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-3">
                      No hay usuarios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
