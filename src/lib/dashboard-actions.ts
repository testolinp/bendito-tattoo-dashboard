"use server";

import { createClient } from "@/lib/supabase/server";

export type TurnoRow = {
  id: number;
  name: string;
  telefono: string;
  gerente_id: number;
  gerente_name: string;
  tatuador_id: number;
  tatuador_name: string;
  jalador_id: number;
  jalador_name: string;
  fecha_cita: string;
  cotizacion: number;
  moneda: string;
  deposito_pesos: number;
  deposito_usd: number;
  deposito_euros: number;
  forma_pago: string;
  pago_pesos: number;
  pago_usd: number;
  pago_euros: number;
  pago_forma_pago: string;
  porcentaje_tatuador: number;
  porcentaje_jalador: number;
  porcentaje_gerente: number;
};

export type StaffCommissionRow = {
  name: string;
  role: string;
  total: number;
  pct: number;
};

export type IncomeStats = {
  totalTurnos: number;
  totalCotizacion: number;
  totalPesos: number;
  totalUsd: number;
  totalEuros: number;
  totalDepPesos: number;
  totalDepUsd: number;
  totalDepEuros: number;
  totalPagPesos: number;
  totalPagUsd: number;
  totalPagEuros: number;
  totalShop: number;
  totalCotPesos: number;
  staffCommissions: StaffCommissionRow[];
  dailyBreakdown: {
    date: string;
    count: number;
    cotizacion: number;
    depPesos: number;
    depUsd: number;
    depEuros: number;
  }[];
  turnos: TurnoRow[];
};

export async function getIncomeStats(start: string, end: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("turnos")
    .select(
      `id, name, telefono, fecha_cita, cotizacion, moneda,
       gerente_id, tatuador_id, jalador_id,
       deposito_pesos, deposito_usd, deposito_euros,
       forma_pago, pago_pesos, pago_usd, pago_euros, pago_forma_pago,
       porcentaje_tatuador, porcentaje_jalador, porcentaje_gerente,
        gerente:staff!gerente_id(name, nickname),
        tatuador:staff!tatuador_id(name, nickname),
        jalador:staff!jalador_id(name, nickname)`
    )
    .gte("fecha_cita", start)
    .lt("fecha_cita", end)
    .order("fecha_cita", { ascending: true });

  if (error) throw new Error(error.message);

  let totalCotizacion = 0;
  let totalPesos = 0;
  let totalUsd = 0;
  let totalEuros = 0;
  let totalDepPesos = 0;
  let totalDepUsd = 0;
  let totalDepEuros = 0;
  let totalPagPesos = 0;
  let totalPagUsd = 0;
  let totalPagEuros = 0;
  let totalCotPesos = 0;
  let totalShop = 0;
  const staffMap = new Map<string, { name: string; role: string; total: number; baseAmount: number }>();

  const dayMap = new Map<
    string,
    { count: number; cotizacion: number; depPesos: number; depUsd: number; depEuros: number }
  >();

  const turnos: TurnoRow[] = [];

  for (const t of data) {
    const cot = Number(t.cotizacion);
    const dp = Number(t.deposito_pesos);
    const du = Number(t.deposito_usd);
    const de = Number(t.deposito_euros);
    const pp = Number(t.pago_pesos);
    const pu = Number(t.pago_usd);
    const pe = Number(t.pago_euros);

    const rate = t.moneda === "USD" ? 16 : t.moneda === "Euros" ? 19 : 1;
    totalCotizacion += cot * rate;
    if (t.moneda === "Pesos") totalPesos += cot;
    else if (t.moneda === "USD") totalUsd += cot;
    else if (t.moneda === "Euros") totalEuros += cot;
    totalDepPesos += dp;
    totalDepUsd += du;
    totalDepEuros += de;
    totalPagPesos += pp;
    totalPagUsd += pu;
    totalPagEuros += pe;

    const quotePesos = cot * rate;
    totalCotPesos += quotePesos;

    const pTat = Number(t.porcentaje_tatuador || 0);
    const pJal = Number(t.porcentaje_jalador || 0);
    const pGer = Number(t.porcentaje_gerente || 0);
    const mTat = quotePesos * pTat / 100;
    const mJal = quotePesos * pJal / 100;
    const mGer = quotePesos * pGer / 100;
    if (t.moneda === "Pesos") {
      totalShop += quotePesos - mTat - mJal - mGer;
    } else {
      // Shop keeps the foreign currency, but pays staff commissions from pesos
      totalShop -= mTat + mJal + mGer;
    }

    const gerenteName = extractName(t.gerente);
    const tatuadorName = extractName(t.tatuador);
    const jaladorName = extractName(t.jalador);

    const addToStaff = (key: string, name: string, role: string, amount: number, pct: number) => {
      if (!name || amount <= 0) return;
      const existing = staffMap.get(key);
      if (existing) {
        existing.total += amount;
        existing.baseAmount += quotePesos;
      } else staffMap.set(key, { name, role, total: amount, baseAmount: quotePesos });
    };

    addToStaff(`ger_${t.gerente_id}`, gerenteName, "Gerente", mGer, pGer);
    addToStaff(`tat_${t.tatuador_id}`, tatuadorName, "Tatuador", mTat, pTat);
    addToStaff(`jal_${t.jalador_id}`, jaladorName, "Jalador", mJal, pJal);

    const day = t.fecha_cita.split("T")[0];
    const entry = dayMap.get(day) || {
      count: 0,
      cotizacion: 0,
      depPesos: 0,
      depUsd: 0,
      depEuros: 0,
    };
    entry.count++;
    entry.cotizacion += cot;
    entry.depPesos += dp;
    entry.depUsd += du;
    entry.depEuros += de;
    dayMap.set(day, entry);

    function extractName(val: unknown): string {
      if (Array.isArray(val)) return (val[0] as { nickname?: string; name?: string })?.nickname || (val[0] as { name?: string })?.name || "";
      if (val && typeof val === "object") return (val as { nickname?: string })?.nickname || (val as { name?: string })?.name || "";
      return "";
    }
    turnos.push({
      id: t.id,
      name: t.name,
      telefono: t.telefono ?? "",
      gerente_id: Number(t.gerente_id),
      gerente_name: extractName(t.gerente),
      tatuador_id: Number(t.tatuador_id),
      tatuador_name: extractName(t.tatuador),
      jalador_id: Number(t.jalador_id),
      jalador_name: extractName(t.jalador),
      fecha_cita: t.fecha_cita,
      cotizacion: cot,
      moneda: t.moneda,
      deposito_pesos: dp,
      deposito_usd: du,
      deposito_euros: de,
      forma_pago: t.forma_pago ?? "",
      pago_pesos: pp,
      pago_usd: pu,
      pago_euros: pe,
      pago_forma_pago: t.pago_forma_pago ?? "",
      porcentaje_tatuador: Number(t.porcentaje_tatuador ?? 0),
      porcentaje_jalador: Number(t.porcentaje_jalador ?? 0),
      porcentaje_gerente: Number(t.porcentaje_gerente ?? 0),
    });
  }

  const dailyBreakdown = Array.from(dayMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalTurnos: data.length,
    totalCotizacion,
    totalPesos,
    totalUsd,
    totalEuros,
    totalDepPesos,
    totalDepUsd,
    totalDepEuros,
    totalPagPesos,
    totalPagUsd,
    totalPagEuros,
    totalShop,
    totalCotPesos,
    staffCommissions: Array.from(staffMap.entries())
      .map(([, v]) => ({
        name: v.name,
        role: v.role,
        total: v.total,
        pct: v.baseAmount > 0 ? Math.round(v.total / v.baseAmount * 100 * 100) / 100 : 0,
      }))
      .sort((a, b) => b.total - a.total),
    dailyBreakdown,
    turnos,
  };
}
