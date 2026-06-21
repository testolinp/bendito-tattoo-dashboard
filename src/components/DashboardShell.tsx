"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { useState } from "react";

const generalNav = [
  { label: "Turnos", href: "/dashboard/turnos" },
  { label: "Citas", href: "/dashboard/citas" },
];

const staffNav = [
  { label: "Gerentes", href: "/dashboard/gerentes" },
  { label: "Jaladores", href: "/dashboard/jaladores" },
  { label: "Tatuadores", href: "/dashboard/tatuadores" },
];

const financeNav = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Cuentas", href: "/dashboard/cuentas" },
  { label: "Pagos", href: "/dashboard/pagos" },
];

type Props = {
  children: React.ReactNode;
  isAdmin: boolean;
  sidebarTitle?: string;
  sidebarDescription?: string;
  sidebarLogoUrl?: string;
};

function SidebarBrand({ title, description, logoUrl }: { title: string; description?: string; logoUrl?: string }) {
  return (
    <div className="d-flex align-items-center gap-2">
      {logoUrl && (
        <img
          src={logoUrl}
          alt={title}
          style={{ width: 50, height: 50, objectFit: "contain" }}
        />
      )}
      <div>
        <h5 className="mb-0">{title}</h5>
        {description && <small className="text-secondary">{description}</small>}
      </div>
    </div>
  );
}

export default function DashboardShell({ children, isAdmin, sidebarTitle = "Bendito Tattoo", sidebarDescription, sidebarLogoUrl }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex min-vh-100">
      <style>{`
        @media (max-width: 767.98px) {
          .main-content > .p-4 { padding-top: 4.5rem !important; }
        }
      `}</style>
      <div className="d-md-none position-fixed top-0 start-0 w-100 bg-dark text-white d-flex align-items-center justify-content-between ps-4 pe-3 py-2" style={{ zIndex: 1050 }}>
        <div className="d-flex align-items-center gap-2">
          {sidebarLogoUrl && (
            <img src={sidebarLogoUrl} alt={sidebarTitle} style={{ height: 32, width: 32, objectFit: "contain" }} />
          )}
          <h6 className="mb-0">{sidebarTitle}</h6>
        </div>
        <button className="btn btn-sm btn-outline-light border-0 fs-4" onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </button>
      </div>

      <div
        className={`bg-dark text-white d-flex flex-column ${
          sidebarOpen ? "d-flex" : "d-none"
        } d-md-flex`}
        style={{ width: 250, minHeight: "100vh", position: "fixed", zIndex: 1052 }}
      >
        <div className="p-3 border-bottom border-secondary">
          <SidebarBrand title={sidebarTitle} description={sidebarDescription} logoUrl={sidebarLogoUrl} />
        </div>

        <nav className="flex-grow-1 p-2">
          {generalNav.map((item) => {
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
              {staffNav.map((item) => {
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
              <hr className="border-secondary my-2" />
              {financeNav.map((item) => {
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
              <Link
                href="/dashboard/settings"
                onClick={() => setSidebarOpen(false)}
                className={`btn w-100 text-start mb-1 ${
                  pathname === "/dashboard/settings" ? "btn-light text-dark" : "btn-dark text-white"
                }`}
              >
                Configuración
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
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1051 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-grow-1 main-content">
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}
