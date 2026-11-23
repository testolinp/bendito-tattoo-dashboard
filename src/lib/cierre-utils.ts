import type { CuentasSummary, CurrencyBreakdown } from "./cuentas-actions";

export type PeriodTotals = {
  pesos: CurrencyBreakdown;
  usd: CurrencyBreakdown;
  euros: CurrencyBreakdown;
};

export function enPesos(b: PeriodTotals): CurrencyBreakdown {
  return {
    efectivo: b.pesos.efectivo + b.usd.efectivo * 16 + b.euros.efectivo * 19,
    cuenta: b.pesos.cuenta + b.usd.cuenta * 16 + b.euros.cuenta * 19,
    total: b.pesos.total + b.usd.total * 16 + b.euros.total * 19,
  };
}

export function totalEnPesos(t: PeriodTotals): number {
  return enPesos(t).total;
}

export function pagoKeko(snapshot: CuentasSummary): number {
  const base = totalEnPesos(snapshot.tienda);
  return Math.round(base * 5) / 100;
}

export function cierreTotals(snapshot: CuentasSummary): PeriodTotals {
  const keko = pagoKeko(snapshot);
  const t = snapshot.totales;
  return {
    pesos: {
      efectivo: t.pesos.efectivo - keko,
      cuenta: t.pesos.cuenta,
      total: t.pesos.total - keko,
    },
    usd: { ...t.usd },
    euros: { ...t.euros },
  };
}
