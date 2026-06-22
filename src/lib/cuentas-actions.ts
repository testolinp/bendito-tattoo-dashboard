"use server";

import { createClient } from "@/lib/supabase/server";
import type { Egreso } from "./egresos-actions";

export type CurrencyBreakdown = {
  efectivo: number;
  cuenta: number;
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
    pesos: CurrencyBreakdown;
    usd: CurrencyBreakdown;
    euros: CurrencyBreakdown;
  };
  totales: {
    pesos: CurrencyBreakdown;
    usd: CurrencyBreakdown;
    euros: CurrencyBreakdown;
  };
  egresos: Egreso[];
};

function addToBreakdown(
  b: CurrencyBreakdown,
  metodo: string,
  amount: number
) {
  b.total += amount;
  if (metodo === "Efectivo") b.efectivo += amount;
  else b.cuenta += amount;
}

function extractStaffCashOnly(val: unknown): boolean {
  let item: { cash_only?: boolean } | null = null;
  if (Array.isArray(val) && val.length > 0) {
    item = val[0] as { cash_only?: boolean };
  } else if (val && typeof val === "object") {
    item = val as { cash_only?: boolean };
  }
  return item?.cash_only === true;
}

export async function getCuentasSummary(start: string, end: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("turnos")
    .select(
      `id, cotizacion, moneda,
       deposito_pesos, deposito_usd, deposito_euros,
       forma_pago, pago_pesos, pago_usd, pago_euros, pago_forma_pago,
       porcentaje_tatuador, porcentaje_jalador, porcentaje_gerente,
       tatuador:staff!tatuador_id(cash_only),
       jalador:staff!jalador_id(cash_only),
       gerente:staff!gerente_id(cash_only)`
    )
    .gte("fecha_cita", start)
    .lt("fecha_cita", end);

  if (error) throw new Error(error.message);

  const ingresos = {
    pesos: { efectivo: 0, cuenta: 0, total: 0 },
    usd: { efectivo: 0, cuenta: 0, total: 0 },
    euros: { efectivo: 0, cuenta: 0, total: 0 },
  };

  let comisionTat = 0;
  let comisionJal = 0;
  let comisionGer = 0;

  const usdShop: CurrencyBreakdown = { efectivo: 0, cuenta: 0, total: 0 };
  const eurosShop: CurrencyBreakdown = { efectivo: 0, cuenta: 0, total: 0 };
  const pesosShop: CurrencyBreakdown = { efectivo: 0, cuenta: 0, total: 0 };

  let pagosEfectivo = 0;
  let pagosCuenta = 0;

  for (const t of data) {
    const dp = Number(t.deposito_pesos);
    const du = Number(t.deposito_usd);
    const de = Number(t.deposito_euros);
    const pp = Number(t.pago_pesos);
    const pu = Number(t.pago_usd);
    const pe = Number(t.pago_euros);

    const fp = t.forma_pago || "";
    const pfp = t.pago_forma_pago || "";

    addToBreakdown(ingresos.pesos, fp, dp);
    addToBreakdown(ingresos.usd, fp, du);
    addToBreakdown(ingresos.euros, fp, de);
    addToBreakdown(ingresos.pesos, pfp, pp);
    addToBreakdown(ingresos.usd, pfp, pu);
    addToBreakdown(ingresos.euros, pfp, pe);

    addToBreakdown(usdShop, fp, du);
    addToBreakdown(usdShop, pfp, pu);
    addToBreakdown(eurosShop, fp, de);
    addToBreakdown(eurosShop, pfp, pe);

    addToBreakdown(pesosShop, fp, dp);
    addToBreakdown(pesosShop, pfp, pp);

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

    const tatCashOnly = extractStaffCashOnly(t.tatuador);
    const jalCashOnly = extractStaffCashOnly(t.jalador);
    const gerCashOnly = extractStaffCashOnly(t.gerente);

    if (mTat > 0) {
      if (tatCashOnly) pagosEfectivo += mTat;
      else pagosCuenta += mTat;
    }
    if (mJal > 0) {
      if (jalCashOnly) pagosEfectivo += mJal;
      else pagosCuenta += mJal;
    }
    if (mGer > 0) {
      if (gerCashOnly) pagosEfectivo += mGer;
      else pagosCuenta += mGer;
    }
  }

  pesosShop.efectivo = Math.round((pesosShop.efectivo - pagosEfectivo) * 100) / 100;
  pesosShop.cuenta = Math.round((pesosShop.cuenta - pagosCuenta) * 100) / 100;
  pesosShop.total = Math.round((pesosShop.total - pagosEfectivo - pagosCuenta) * 100) / 100;

  let egresos: Egreso[] = [];
  try {
    const { data: egresosData, error: egresosError } = await supabase
      .from("egresos")
      .select("*")
      .gte("date", start.slice(0, 10))
      .lt("date", end.slice(0, 10))
      .order("date", { ascending: true });

    if (!egresosError) {
      egresos = (egresosData || []) as Egreso[];
    }
  } catch {
    // table may not exist yet
  }

  const totalesPesos: CurrencyBreakdown = {
    efectivo: pesosShop.efectivo,
    cuenta: pesosShop.cuenta,
    total: pesosShop.total,
  };

  for (const eg of egresos) {
    if (eg.payment_method === "Efectivo") totalesPesos.efectivo -= eg.amount;
    else totalesPesos.cuenta -= eg.amount;
    totalesPesos.total -= eg.amount;
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
    totales: {
      pesos: totalesPesos,
      usd: usdShop,
      euros: eurosShop,
    },
    egresos,
  };
}
