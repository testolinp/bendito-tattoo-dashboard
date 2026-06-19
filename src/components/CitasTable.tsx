"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
} from "@/lib/appointments-actions";
import type { Appointment } from "@/lib/appointments-actions";
import type { StaffMember } from "@/lib/staff-actions";
import { naiveToISO, formatDateTime, toDateTimeLocal } from "@/lib/datetime-utils";
import ConfirmDialog from "@/components/ConfirmDialog";

const PAGE_SIZE = 10;
const hasPhone = (a: Appointment) => a.telefono.replace(/[^0-9]/g, "").length >= 10;

const waMsgUrl = (a: Appointment) => {
  const rate = a.moneda === "USD" ? 16 : a.moneda === "Euros" ? 19 : 1;
  const totalPesos = a.cotizacion * rate;
  const paid = a.deposito_pesos + a.deposito_usd * 16 + a.deposito_euros * 19;
  const remaining = Math.max(0, totalPesos - paid);
  const date = new Date(a.fecha_cita);
  const dateStr = date.toLocaleDateString("es-MX", { timeZone: "America/Cancun", day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = date.toLocaleTimeString("es-MX", { timeZone: "America/Cancun", hour: "2-digit", minute: "2-digit", hour12: false });
  const dateEn = date.toLocaleDateString("en-US", { timeZone: "America/Cancun", day: "2-digit", month: "2-digit", year: "numeric" });
  const timeEn = date.toLocaleTimeString("en-US", { timeZone: "America/Cancun", hour: "2-digit", minute: "2-digit", hour12: false });
  const sym = a.moneda === "Pesos" ? "$" : a.moneda === "USD" ? "USD $" : "\u20AC";
  const pagoEs = remaining <= 0 ? "YA EST\u00C1 TOTALMENTE PAGO" : `LE QUEDA PAGAR $${remaining.toFixed(2)}`;
  const pagoEn = remaining <= 0 ? "IT IS FULLY PAID" : `YOU HAVE $${remaining.toFixed(2)} LEFT TO PAY`;
  const msg = `\u00A1Hola! Te confirmamos tu turno en Bendito Tattoo.\n\n\u2022 Fecha y Hora: ${dateStr} a las ${timeStr} hs.\n\u2022 Costo total: ${sym}${a.cotizacion.toFixed(2)}\n\u2022 Estado del pago: ${pagoEs}\n\u2022 Direcci\u00F3n: https://maps.app.goo.gl/vW3qK7jbywo6gUBu5\n\n\u00A1Te esperamos! Record\u00E1 venir con ropa c\u00F3moda y bien alimentado.\n\n---\n\nHello! We confirm your appointment at Bendito Tattoo.\n\n\u2022 Date and Time: ${dateEn} at ${timeEn}\n\u2022 Total Cost: ${sym}${a.cotizacion.toFixed(2)}\n\u2022 Payment Status: ${pagoEn}\n\u2022 Address: https://maps.app.goo.gl/vW3qK7jbywo6gUBu5\n\nWe look forward to seeing you! Remember to come in comfortable clothes and well-fed.`;
  return `https://wa.me/${a.telefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`;
};

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

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="d-flex justify-content-center gap-1 py-2">
      <button className="btn btn-sm btn-outline-secondary" disabled={page <= 0} onClick={() => onChange(page - 1)}>◀</button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button key={i} className={`btn btn-sm ${i === page ? "btn-dark" : "btn-outline-secondary"}`} onClick={() => onChange(i)}>
          {i + 1}
        </button>
      ))}
      <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>▶</button>
    </div>
  );
}

export default function CitasTable({ appointments, gerentes, tatuadores, jaladores }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [viewing, setViewing] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingPage, setPendingPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [pendingCancelId, setPendingCancelId] = useState<number | null>(null);
  const [pendingCompleteId, setPendingCompleteId] = useState<number | null>(null);

  const [formCotizacion, setFormCotizacion] = useState("");
  const [formMoneda, setFormMoneda] = useState("Pesos");
  const [formDepPesos, setFormDepPesos] = useState("");
  const [formDepUsd, setFormDepUsd] = useState("");
  const [formDepEur, setFormDepEur] = useState("");

  const editModalRef = useRef<HTMLDivElement>(null);
  const viewModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalOpen) editModalRef.current?.focus();
  }, [modalOpen]);

  useEffect(() => {
    if (viewing) viewModalRef.current?.focus();
  }, [viewing]);

  const pending = appointments.filter((a) => a.status === "pendiente");
  const history = appointments.filter((a) => a.status === "concretada" || a.status === "cancelada");
  const gerenteLabelById = new Map(
    gerentes.map((g) => [g.id, (g.nickname && g.nickname.trim()) || g.name]),
  );
  const tatuadorLabelById = new Map(
    tatuadores.map((t) => [t.id, (t.nickname && t.nickname.trim()) || t.name]),
  );
  const jaladorLabelById = new Map(
    jaladores.map((j) => [j.id, (j.nickname && j.nickname.trim()) || j.name]),
  );

  const openCreate = () => {
    setEditing(null);
    setFormCotizacion("");
    setFormMoneda("Pesos");
    setFormDepPesos("");
    setFormDepUsd("");
    setFormDepEur("");
    setModalOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    setFormCotizacion(String(a.cotizacion ?? ""));
    setFormMoneda(a.moneda ?? "Pesos");
    setFormDepPesos(String(a.deposito_pesos ?? ""));
    setFormDepUsd(String(a.deposito_usd ?? ""));
    setFormDepEur(String(a.deposito_euros ?? ""));
    setModalOpen(true);
  };

  const openView = (a: Appointment) => {
    setViewing(a);
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

    const codigoPais = formData.get("codigo_pais") as string || "+52";
    const telefono = formData.get("telefono") as string || "";
    formData.set("telefono", `${codigoPais} ${telefono}`);

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
    setPendingCancelId(id);
  };

  const router = useRouter();

  const handleComplete = async (id: number) => {
    setPendingCompleteId(id);
  };

  // formatDateTime and toDateTimeLocal now imported from datetime-utils

  function renderTable(title: string, list: Appointment[], page: number, setPage: (p: number) => void, showActions: boolean) {
    const start = page * PAGE_SIZE;
    const slice = list.slice(start, start + PAGE_SIZE);

    return (
      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span className="fw-semibold">{title}</span>
          <span className="text-muted small">{list.length} registros</span>
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
                <th>Estado</th>
                <th style={{ width: 220 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    No hay citas {title.toLowerCase()}
                  </td>
                </tr>
              )}
              {slice.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{gerenteLabelById.get(a.gerente_id) ?? a.gerente_name}</td>
                  <td>{tatuadorLabelById.get(a.tatuador_id) ?? a.tatuador_name}</td>
                  <td>{jaladorLabelById.get(a.jalador_id) ?? a.jalador_name}</td>
                  <td>{Number(a.cotizacion).toFixed(2)} {a.moneda === "Pesos" ? "$" : a.moneda}</td>
                  <td>{formatDateTime(a.fecha_cita)}</td>
                  <td>
                    <span className={`badge ${statusColors[a.status] || "bg-secondary"}`}>
                      {statusLabels[a.status] || a.status}
                    </span>
                  </td>
                  {showActions && (
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn btn-sm btn-outline-info me-1" onClick={() => openView(a)}>
                        Ver
                      </button>
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(a)}>
                        Editar
                      </button>
                      {hasPhone(a) ? (
                        <a
                          href={waMsgUrl(a)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-success me-1"
                        >
                          Mensaje
                        </a>
                      ) : (
                        <span className="btn btn-sm btn-outline-secondary disabled me-1">
                          Mensaje
                        </span>
                      )}
                      {a.status === "pendiente" && (
                        <>
                          <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleComplete(a.id)}>
                            Concretar
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(a.id)}>
                            Cancelar
                          </button>
                        </>
                      )}
                    </td>
                  )}
                  {!showActions && (
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn btn-sm btn-outline-info me-1" onClick={() => openView(a)}>
                        Ver
                      </button>
                      {hasPhone(a) ? (
                        <a
                          href={waMsgUrl(a)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-success me-1"
                        >
                          Mensaje
                        </a>
                      ) : (
                        <span className="btn btn-sm btn-outline-secondary disabled me-1">
                          Mensaje
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={list.length} onChange={setPage} />
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={pendingCancelId !== null}
        title="Cancelar cita"
        message="¿Cancelar esta cita?"
        confirmLabel="Cancelar"
        onConfirm={async () => {
          if (pendingCancelId === null) return;
          const result = await cancelAppointment(pendingCancelId);
          setPendingCancelId(null);
          if (result?.error) alert(result.error);
        }}
        onCancel={() => setPendingCancelId(null)}
      />

      <ConfirmDialog
        open={pendingCompleteId !== null}
        title="Concretar cita"
        message="¿Concretar esta cita?"
        confirmLabel="Concretar"
        variant="dark"
        onConfirm={async () => {
          if (pendingCompleteId === null) return;
          const result = await completeAppointment(pendingCompleteId);
          setPendingCompleteId(null);
          if (result?.error) {
            alert(result.error);
          } else {
            router.push(`/dashboard/turnos?editTurnoId=${result.turnoId}`);
          }
        }}
        onCancel={() => setPendingCompleteId(null)}
      />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Citas</h2>
        <button className="btn btn-dark" onClick={openCreate}>
          + Nueva cita
        </button>
      </div>

      {modalOpen && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }} ref={editModalRef} onKeyDown={(e) => { if (e.key === "Escape") setModalOpen(false); }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? "Editar cita" : "Nueva cita"}</h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {editing && <input type="hidden" name="id" value={editing.id} />}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nombre</label>
                      <input name="name" type="text" className="form-control" defaultValue={editing?.name ?? ""} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Teléfono</label>
                      <div className="input-group">
                        <select name="codigo_pais" className="form-select" style={{ maxWidth: 110 }} defaultValue={editing?.telefono ? (editing.telefono.split(" ")[0] ?? "+52") : "+52"}>
                          <option value="+52">🇲🇽 +52</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+34">🇪🇸 +34</option>
                          <option value="+54">🇦🇷 +54</option>
                          <option value="+57">🇨🇴 +57</option>
                          <option value="+56">🇨🇱 +56</option>
                          <option value="+51">🇵🇪 +51</option>
                          <option value="+598">🇺🇾 +598</option>
                        </select>
                        <input name="telefono" type="tel" className="form-control" placeholder="5551234567" defaultValue={editing?.telefono ? editing.telefono.split(" ").slice(1).join(" ") : ""} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Gerente</label>
                      <select name="gerente_id" className="form-select" defaultValue={editing?.gerente_id ?? ""} required>
                        <option value="">Seleccionar</option>
                        {gerentes.map((g) => (<option key={g.id} value={g.id}>{(g.nickname && g.nickname.trim()) || g.name}</option>))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Tatuador</label>
                      <select name="tatuador_id" className="form-select" defaultValue={editing?.tatuador_id ?? ""} required>
                        <option value="">Seleccionar</option>
                        {tatuadores.map((t) => (<option key={t.id} value={t.id}>{(t.nickname && t.nickname.trim()) || t.name}</option>))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Jalador</label>
                      <select name="jalador_id" className="form-select" defaultValue={editing?.jalador_id ?? ""} required>
                        <option value="">Seleccionar</option>
                        {jaladores.map((j) => (<option key={j.id} value={j.id}>{(j.nickname && j.nickname.trim()) || j.name}</option>))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Fecha de la cita</label>
                      <input name="fecha_cita" type="datetime-local" className="form-control" defaultValue={editing ? toDateTimeLocal(editing.fecha_cita) : ""} required />
                    </div>
                    {/* Cotización */}
                    <div className="col-12">
                      <hr className="my-2" />
                      <h6 className="fw-bold mb-2">Cotización</h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Cotización</label>
                      <div className="input-group">
                        <input name="cotizacion" type="number" step="0.01" min="0" className="form-control" value={formCotizacion} onChange={(e) => setFormCotizacion(e.target.value)} required />
                        <select name="moneda" className="form-select" style={{ maxWidth: 110 }} value={formMoneda} onChange={(e) => setFormMoneda(e.target.value)} required>
                          <option value="Pesos">Pesos</option>
                          <option value="USD">USD</option>
                          <option value="Euros">Euros</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6 d-flex align-items-end pb-1">
                      <div className="fw-semibold fs-4">
                        {(() => {
                          const q = Number(formCotizacion || 0);
                          const r = formMoneda === "USD" ? 16 : formMoneda === "Euros" ? 19 : 1;
                          const qPesos = q * r;
                          const p = Number(formDepPesos || 0) + Number(formDepUsd || 0) * 16 + Number(formDepEur || 0) * 19;
                          const rem = Math.max(0, qPesos - p);
                          return `Falta pagar: $${rem.toFixed(2)}`;
                        })()}
                      </div>
                    </div>
                    {/* Depósito */}
                    <div className="col-12">
                      <hr className="my-2" />
                      <h6 className="fw-bold mb-2">Depósito</h6>
                    </div>
                    <div className="col-12">
                      <div className="row g-2">
                        <div className="col-md-4">
                          <div className="input-group">
                            <span className="input-group-text">$</span>
                            <input name="deposito_pesos" type="number" step="0.01" min="0" className="form-control" placeholder="Pesos" value={formDepPesos} onChange={(e) => setFormDepPesos(e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="input-group">
                            <span className="input-group-text">USD</span>
                            <input name="deposito_usd" type="number" step="0.01" min="0" className="form-control" placeholder="USD" value={formDepUsd} onChange={(e) => setFormDepUsd(e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="input-group">
                            <span className="input-group-text">€</span>
                            <input name="deposito_euros" type="number" step="0.01" min="0" className="form-control" placeholder="Euros" value={formDepEur} onChange={(e) => setFormDepEur(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Forma de pago</label>
                      <select name="forma_pago" className="form-select" defaultValue={editing?.forma_pago ?? ""}>
                        <option value="">Seleccionar</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Deposito">Depósito</option>
                        <option value="Tarjeta">Tarjeta</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-dark" disabled={submitting}>
                    {submitting ? "Guardando..." : editing ? "Guardar cambios" : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }} ref={viewModalRef} onKeyDown={(e) => { if (e.key === "Escape") closeView(); }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cita</h5>
                <button type="button" className="btn-close" onClick={closeView} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Nombre</label>
                    <div className="fw-semibold">{viewing.name}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Teléfono</label>
                    <div className="fw-semibold">{viewing.telefono || "-"}</div>
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
                        const p = Number(viewing.deposito_pesos || 0) + Number(viewing.deposito_usd || 0) * 16 + Number(viewing.deposito_euros || 0) * 19;
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
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeView}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderTable("Pendientes", pending, pendingPage, setPendingPage, true)}
      {renderTable("Historial", history, historyPage, setHistoryPage, false)}
    </>
  );
}
