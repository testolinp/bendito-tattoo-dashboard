"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createCierre, deleteCierre, type Cierre } from "@/lib/cierres-actions";
import { cierreTotals, totalEnPesos } from "@/lib/cierre-utils";
import { formatDateTime, isDateString } from "@/lib/datetime-utils";
import ConfirmDialog from "@/components/ConfirmDialog";

type Totales = { usd: number; pesos: number; final: number };

const fmt = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("es-MX", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function CierresTable({ cierres }: { cierres: Cierre[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [formFrom, setFormFrom] = useState("");
  const [formTo, setFormTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Cierre | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const grupos: { anio: number; cierres: Cierre[]; totales: Totales }[] = [];
  const totales: Totales = { usd: 0, pesos: 0, final: 0 };

  for (const cierre of cierres) {
    const anio = Number(cierre.fecha_desde.slice(0, 4));
    let grupo = grupos.find((g) => g.anio === anio);
    if (!grupo) {
      grupo = { anio, cierres: [], totales: { usd: 0, pesos: 0, final: 0 } };
      grupos.push(grupo);
    }

    const net = cierreTotals(cierre.snapshot);
    const final = totalEnPesos(net);
    grupo.cierres.push(cierre);
    grupo.totales.usd += net.usd.total;
    grupo.totales.pesos += net.pesos.total;
    grupo.totales.final += final;
    totales.usd += net.usd.total;
    totales.pesos += net.pesos.total;
    totales.final += final;
  }

  useEffect(() => {
    if (modalOpen) modalRef.current?.focus();
  }, [modalOpen]);

  const openCreate = () => {
    setFormFrom("");
    setFormTo("");
    setModalOpen(true);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isDateString(formFrom) || !isDateString(formTo)) {
      alert("Seleccioná las fechas desde y hasta");
      return;
    }
    if (formFrom > formTo) {
      alert("La fecha desde no puede ser posterior a la fecha hasta");
      return;
    }

    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await createCierre(formData);
    setSaving(false);

    if (!result || "error" in result) {
      alert("Error al crear el cierre: " + (result?.error ?? "desconocido"));
      return;
    }
    setModalOpen(false);
    router.push(`/dashboard/cierres/${result.id}`);
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Cierres</h2>
        <button className="btn btn-dark" onClick={openCreate}>
          + Nuevo cierre
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Desde</th>
                <th>Hasta</th>
                <th className="text-end">Dólares</th>
                <th className="text-end">Pesos</th>
                <th className="text-end">Total final</th>
                <th className="d-none d-md-table-cell">Creado</th>
                <th style={{ width: 150 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cierres.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No hay registros
                  </td>
                </tr>
              )}
              {grupos.map((grupo) => (
                <Fragment key={grupo.anio}>
                  <tr className="table-secondary">
                    <td colSpan={7} className="fw-bold">
                      {grupo.anio}
                    </td>
                  </tr>
                  {grupo.cierres.map((cierre) => {
                    const net = cierreTotals(cierre.snapshot);
                    return (
                    <tr
                      key={cierre.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/dashboard/cierres/${cierre.id}`)}
                    >
                      <td>{formatDate(cierre.fecha_desde)}</td>
                      <td>{formatDate(cierre.fecha_hasta)}</td>
                      <td className="text-end">USD ${fmt(net.usd.total)}</td>
                      <td className="text-end">${fmt(net.pesos.total)}</td>
                      <td className="text-end fw-bold">${fmt(totalEnPesos(net))}</td>
                      <td className="d-none d-md-table-cell">
                        {formatDateTime(cierre.created_at)}
                      </td>
                      <td>
                        <div className="d-flex flex-nowrap gap-1">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/cierres/${cierre.id}`);
                            }}
                          >
                            Ver
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingDelete(cierre);
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  <tr className="table-light fw-bold">
                    <td>Total {grupo.anio}</td>
                    <td></td>
                    <td className="text-end">USD ${fmt(grupo.totales.usd)}</td>
                    <td className="text-end">${fmt(grupo.totales.pesos)}</td>
                    <td className="text-end">${fmt(grupo.totales.final)}</td>
                    <td className="d-none d-md-table-cell"></td>
                    <td></td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
            {cierres.length > 0 && (
              <tfoot className="table-light fw-bold">
                <tr>
                  <td>Total general</td>
                  <td></td>
                  <td className="text-end">USD ${fmt(totales.usd)}</td>
                  <td className="text-end">${fmt(totales.pesos)}</td>
                  <td className="text-end">${fmt(totales.final)}</td>
                  <td className="d-none d-md-table-cell"></td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar cierre"
        message="¿Eliminar este cierre? Se perderá el snapshot guardado."
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (!pendingDelete) return;
          const result = await deleteCierre(pendingDelete.id);
          setPendingDelete(null);
          if (result?.error) {
            alert("Error al eliminar el cierre: " + result.error);
            return;
          }
          router.refresh();
        }}
        onCancel={() => setPendingDelete(null)}
      />

      {modalOpen && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          ref={modalRef}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !saving) setModalOpen(false);
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuevo cierre</h5>
                <button
                  type="button"
                  className="btn-close"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Desde</label>
                      <input
                        name="desde"
                        type="date"
                        className="form-control"
                        value={formFrom}
                        max={formTo || undefined}
                        onChange={(e) => setFormFrom(e.target.value)}
                        required
                        suppressHydrationWarning
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Hasta</label>
                      <input
                        name="hasta"
                        type="date"
                        className="form-control"
                        value={formTo}
                        min={formFrom || undefined}
                        onChange={(e) => setFormTo(e.target.value)}
                        required
                        suppressHydrationWarning
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={saving}
                    onClick={() => setModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-dark" disabled={saving}>
                    {saving ? "Creando..." : "Crear"}
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
