"use server";

import { createClient } from "@/lib/supabase/server";

export type CurrencyBreakdown = {
  efectivo: number;
  deposito: number;
  tarjeta: number;
  total: number;
};

export type CuentasSummary = {
  ingresos: {
    pesos: CurrencyBreakdown;
    usd: CurrencyBreakdown;
    euros: CurrencyBreakdown;
  };
  comisiones: {
    tatuador: number;
    jalador: number;
    gerente: number;
    total: number;
  };
  tienda: {
    pesos: number;
    usd: CurrencyBreakdown;
    euros: CurrencyBreakdown;
  };
};

function addToBreakdown(
  b: CurrencyBreakdown,
  metodo: string,
  amount: number
) {
  b.total += amount;
  if (metodo === "Efectivo") b.efectivo += amount;
  else if (metodo === "Deposito" || metodo === "Depósito") b.deposito += amount;
  else b.tarjeta += amount;
}

export async function getCuentasSummary(start: string, end: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("turnos")
    .select(
      `id, cotizacion, moneda,
       deposito_pesos, deposito_usd, deposito_euros,
       forma_pago, pago_pesos, pago_usd, pago_euros, pago_forma_pago,
       porcentaje_tatuador, porcentaje_jalador, porcentaje_gerente`
    )
    .gte("fecha_cita", start)
    .lt("fecha_cita", end);

  if (error) throw new Error(error.message);

  const ingresos = {
    pesos: { efectivo: 0, deposito: 0, tarjeta: 0, total: 0 },
    usd: { efectivo: 0, deposito: 0, tarjeta: 0, total: 0 },
    euros: { efectivo: 0, deposito: 0, tarjeta: 0, total: 0 },
  };

  let comisionTat = 0;
  let comisionJal = 0;
  let comisionGer = 0;

  const usdShop: CurrencyBreakdown = { efectivo: 0, deposito: 0, tarjeta: 0, total: 0 };
  const eurosShop: CurrencyBreakdown = { efectivo: 0, deposito: 0, tarjeta: 0, total: 0 };
  let pesosShop = 0;

  for (const t of data) {
    const dp = Number(t.deposito_pesos);
    const du = Number(t.deposito_usd);
    const de = Number(t.deposito_euros);
    const pp = Number(t.pago_pesos);
    const pu = Number(t.pago_usd);
    const pe = Number(t.pago_euros);

    const fp = t.forma_pago || "";
    const pfp = t.pago_forma_pago || "";

    // Ingresos: sum deposits and payments by currency + method
    addToBreakdown(ingresos.pesos, fp, dp);
    addToBreakdown(ingresos.usd, fp, du);
    addToBreakdown(ingresos.euros, fp, de);
    addToBreakdown(ingresos.pesos, pfp, pp);
    addToBreakdown(ingresos.usd, pfp, pu);
    addToBreakdown(ingresos.euros, pfp, pe);

    // The shop keeps foreign currency deposits/payments as-is
    addToBreakdown(usdShop, fp, du);
    addToBreakdown(usdShop, pfp, pu);
    addToBreakdown(eurosShop, fp, de);
    addToBreakdown(eurosShop, pfp, pe);

    // For peso transactions: shop keeps what's left after commissions
    const cot = Number(t.cotizacion);
    const rate = t.moneda === "USD" ? 16 : t.moneda === "Euros" ? 19 : 1;
    const quotePesos = cot * rate;

    const pTat = Number(t.porcentaje_tatuador || 0);
    const pJal = Number(t.porcentaje_jalador || 0);
    const pGer = Number(t.porcentaje_gerente || 0);

    const mTat = (quotePesos * pTat) / 100;
    const mJal = (quotePesos * pJal) / 100;
    const mGer = (quotePesos * pGer) / 100;

    comisionTat += mTat;
    comisionJal += mJal;
    comisionGer += mGer;

    if (t.moneda === "Pesos") {
      pesosShop += quotePesos - mTat - mJal - mGer;
    } else {
      // Commissions paid from peso income reduce the shop's pesos
      pesosShop -= mTat + mJal + mGer;
    }
  }

  return {
    ingresos,
    comisiones: {
      tatuador: comisionTat,
      jalador: comisionJal,
      gerente: comisionGer,
      total: comisionTat + comisionJal + comisionGer,
    },
    tienda: {
      pesos: pesosShop,
      usd: usdShop,
      euros: eurosShop,
    },
  };
}
