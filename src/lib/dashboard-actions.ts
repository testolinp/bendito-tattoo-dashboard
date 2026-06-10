"use server";

import { createClient } from "@/lib/supabase/server";

export type TurnoRow = {
  id: number;
  name: string;
  gerente_name: string;
  tatuador_name: string;
  jalador_name: string;
  fecha_cita: string;
  cotizacion: number;
  moneda: string;
  deposito_pesos: number;
  deposito_usd: number;
  deposito_euros: number;
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
      `id, name, fecha_cita, cotizacion, moneda,
       deposito_pesos, deposito_usd, deposito_euros,
       gerente:staff!gerente_id(name),
       tatuador:staff!tatuador_id(name),
       jalador:staff!jalador_id(name)`
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

    totalCotizacion += cot;
    if (t.moneda === "Pesos") totalPesos += cot;
    else if (t.moneda === "USD") totalUsd += cot;
    else if (t.moneda === "Euros") totalEuros += cot;
    totalPesos += dp;
    totalUsd += du;
    totalEuros += de;
    totalDepPesos += dp;
    totalDepUsd += du;
    totalDepEuros += de;

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
      if (Array.isArray(val)) return (val[0] as { name?: string })?.name ?? "";
      if (val && typeof val === "object") return (val as { name?: string }).name ?? "";
      return "";
    }
    turnos.push({
      id: t.id,
      name: t.name,
      gerente_name: extractName(t.gerente),
      tatuador_name: extractName(t.tatuador),
      jalador_name: extractName(t.jalador),
      fecha_cita: t.fecha_cita,
      cotizacion: cot,
      moneda: t.moneda,
      deposito_pesos: dp,
      deposito_usd: du,
      deposito_euros: de,
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
    dailyBreakdown,
    turnos,
  };
}
