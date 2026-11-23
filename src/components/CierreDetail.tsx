"use client";

import Link from "next/link";
import type { Cierre } from "@/lib/cierres-actions";
import type { CurrencyBreakdown } from "@/lib/cuentas-actions";
import { cierreTotals, enPesos, pagoKeko, totalEnPesos } from "@/lib/cierre-utils";
import { formatDateTime, rangeLabel } from "@/lib/datetime-utils";

const fmt = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function BreakdownRow({ label, data }: { label: string; data: CurrencyBreakdown }) {
  return (
    <tr>
      <td>{label}</td>
      <td className="text-end">${fmt(data.efectivo)}</td>
      <td className="text-end">${fmt(data.cuenta)}</td>
      <td className="text-end fw-bold">${fmt(data.total)}</td>
    </tr>
  );
}

export default function CierreDetail({ cierre }: { cierre: Cierre }) {
  const s = cierre.snapshot;
  const net = cierreTotals(s);
  const keko = pagoKeko(s);
  const ingresosPesos = enPesos(s.ingresos);
  const egresosTotal = s.egresos.reduce((sum, eg) => sum + eg.amount, 0);

  return (
    <div>
      <style>{`
        @media print {
          .cierre-print-title { display: none !important; }
          .cierre-print-created { display: none !important; }
          div.cierre-print-header { margin-bottom: 1.5rem !important; }
          div.cierre-print-range {
            font-size: 1.15rem !important;
            font-weight: 700 !important;
            color: #000 !important;
          }
        }
      `}</style>
      <div className="d-flex justify-content-between align-items-center mb-3 cierre-print-header">
        <div>
          <h2 className="h4 mb-0 cierre-print-title">Cierre</h2>
          <div className="text-muted small text-capitalize cierre-print-range">
            {rangeLabel({ from: cierre.fecha_desde, to: cierre.fecha_hasta })}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link href="/dashboard/cierres" className="btn btn-sm btn-outline-secondary">
            Volver
          </Link>
          <button className="btn btn-sm btn-dark" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
      </div>

      <p className="text-muted small mb-3 cierre-print-created">
        Creado el {formatDateTime(cierre.created_at)}
      </p>

      <div className="card mb-3">
        <div className="card-header fw-bold">Ingresos</div>
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>Moneda</th>
                <th className="text-end">Efectivo</th>
                <th className="text-end">Cuenta</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              <BreakdownRow label="Pesos" data={s.ingresos.pesos} />
              <BreakdownRow label="USD" data={s.ingresos.usd} />
              <BreakdownRow label="Euros" data={s.ingresos.euros} />
            </tbody>
            <tfoot className="table-light">
              <tr>
                <td className="fw-bold">Total ingresos (en pesos)</td>
                <td className="text-end fw-bold">${fmt(ingresosPesos.efectivo)}</td>
                <td className="text-end fw-bold">${fmt(ingresosPesos.cuenta)}</td>
                <td className="text-end fw-bold">${fmt(ingresosPesos.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header fw-bold d-flex justify-content-between align-items-center">
          <span>Comisiones pagadas</span>
          <Link
            href={`/dashboard/pagos?from=${cierre.fecha_desde}&to=${cierre.fecha_hasta}`}
            className="btn btn-sm btn-outline-dark"
          >
            Ver pagos
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>Rol</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tatuador</td>
                <td className="text-end">${fmt(s.comisiones.tatuador)}</td>
              </tr>
              <tr>
                <td>Jalador</td>
                <td className="text-end">${fmt(s.comisiones.jalador)}</td>
              </tr>
              <tr>
                <td>Gerente</td>
                <td className="text-end">${fmt(s.comisiones.gerente)}</td>
              </tr>
              <tr className="table-light fw-bold">
                <td>Total</td>
                <td className="text-end">${fmt(s.comisiones.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header fw-bold">Pago a Keko</div>
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>Concepto</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>5% de (ingresos - comisiones)</td>
                <td className="text-end">${fmt(keko)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header fw-bold">Egresos</div>
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Método</th>
                <th className="text-end">Monto</th>
              </tr>
            </thead>
            <tbody>
              {s.egresos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-3">
                    Sin egresos
                  </td>
                </tr>
              ) : (
                s.egresos.map((eg) => (
                  <tr key={eg.id}>
                    <td>
                      {eg.date
                        ? new Date(eg.date + "T12:00:00").toLocaleDateString("es-MX")
                        : "—"}
                    </td>
                    <td>{eg.description || "—"}</td>
                    <td>{eg.payment_method}</td>
                    <td className="text-end">${fmt(eg.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="table-light fw-bold">
              <tr>
                <td colSpan={3}>Total egresos</td>
                <td className="text-end">${fmt(egresosTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="card border-dark">
        <div className="card-header fw-bold">Total del período (Ingresos - Comisiones - Keko - Egresos)</div>
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>Moneda</th>
                <th className="text-end">Efectivo</th>
                <th className="text-end">Cuenta</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              <BreakdownRow label="Pesos" data={net.pesos} />
              <BreakdownRow label="USD" data={net.usd} />
              <BreakdownRow label="Euros" data={net.euros} />
            </tbody>
            <tfoot className="table-light fw-bold">
              <tr>
                <td>Total final (en pesos)</td>
                <td className="text-end">${fmt(enPesos(net).efectivo)}</td>
                <td className="text-end">${fmt(enPesos(net).cuenta)}</td>
                <td className="text-end">${fmt(totalEnPesos(net))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
