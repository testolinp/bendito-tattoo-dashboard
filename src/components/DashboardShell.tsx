"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Turnos", href: "/dashboard/turnos" },
  { label: "Citas", href: "/dashboard/citas" },
  { label: "Gerentes", href: "/dashboard/gerentes" },
  { label: "Jaladores", href: "/dashboard/jaladores" },
  { label: "Tatuadores", href: "/dashboard/tatuadores" },
  { label: "Cuentas", href: "/dashboard/cuentas" },
];

type Props = {
  children: React.ReactNode;
  userEmail: string;
  isAdmin: boolean;
};

export default function DashboardShell({ children, userEmail, isAdmin }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex min-vh-100">
      <button
        className="btn btn-dark d-md-none position-fixed top-0 start-0 m-2"
        style={{ zIndex: 1050 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      <div
        className={`bg-dark text-white d-flex flex-column ${
          sidebarOpen ? "d-flex" : "d-none"
        } d-md-flex`}
        style={{ width: 250, minHeight: "100vh", position: "fixed", zIndex: 1040 }}
      >
        <div className="p-3 border-bottom border-secondary">
          <h5 className="mb-0">Bendito Tattoo</h5>
          <small className="text-secondary">{userEmail || "Dashboard"}</small>
        </div>

        <nav className="flex-grow-1 p-2">
          {(isAdmin ? navItems : navItems.filter((item) => item.href === "/dashboard/turnos" || item.href === "/dashboard/citas")).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`btn w-100 text-start mb-1 ${
                  active ? "btn-light text-dark" : "btn-dark text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <>
              <hr className="border-secondary my-2" />
              <Link
                href="/dashboard/users"
                onClick={() => setSidebarOpen(false)}
                className={`btn w-100 text-start mb-1 ${
                  pathname === "/dashboard/users" ? "btn-light text-dark" : "btn-dark text-white"
                }`}
              >
                Usuarios
              </Link>
            </>
          )}
        </nav>

        <div className="p-3 border-top border-secondary">
          <form action={logout}>
            <button type="submit" className="btn btn-outline-light btn-sm w-100">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1030 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-grow-1 main-content">
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}
