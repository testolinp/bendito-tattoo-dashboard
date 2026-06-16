"use client";

import { useActionState } from "react";
import { login } from "@/app/auth/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-body-secondary">
      <div className="card shadow" style={{ width: "100%", maxWidth: 400 }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h1 className="h3 fw-bold">Bendito Tattoo</h1>
            <p className="text-muted">Inicia sesión para continuar</p>
          </div>

          <form action={formAction}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Usuario
              </label>
              <input
                id="email"
                name="email"
                type="text"
                className="form-control"
                placeholder="admin@benditotattoo.com"
                required
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                required
              />
            </div>

            {state?.error && (
              <div className="alert alert-danger py-2">{state.error}</div>
            )}

            <button
              type="submit"
              className="btn btn-dark w-100 py-2"
              disabled={pending}
            >
              {pending ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
