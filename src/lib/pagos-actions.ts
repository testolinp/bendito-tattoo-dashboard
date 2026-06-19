"use server";

import { createClient } from "@/lib/supabase/server";

export type PersonPayment = {
  name: string;
  total: number;
  roles: { role: string; pct: number; amount: number }[];
};

export type PaymentSummary = {
  totalPagado: number;
  people: PersonPayment[];
};

export async function getPaymentSummary(start: string, end: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("turnos")
    .select(
      `id, cotizacion, moneda,
       gerente_id, tatuador_id, jalador_id,
       porcentaje_tatuador, porcentaje_jalador, porcentaje_gerente,
       gerente:staff!gerente_id(nickname, name),
       tatuador:staff!tatuador_id(nickname, name),
       jalador:staff!jalador_id(nickname, name)`
    )
    .gte("fecha_cita", start)
    .lt("fecha_cita", end);

  if (error) throw new Error(error.message);

  const personMap = new Map<string, PersonPayment>();

  function extractName(val: unknown): string {
    if (Array.isArray(val))
      return (
        (val[0] as { nickname?: string; name?: string })?.nickname ||
        (val[0] as { name?: string })?.name ||
        ""
      );
    if (val && typeof val === "object")
      return (
        (val as { nickname?: string })?.nickname ||
        (val as { name?: string })?.name ||
        ""
      );
    return "";
  }

  function addToPerson(
    name: string,
    role: string,
    pct: number,
    amount: number
  ) {
    if (!name || amount <= 0) return;
    const existing = personMap.get(name);
    if (existing) {
      existing.total += amount;
      const existingRole = existing.roles.find((r) => r.role === role);
      if (existingRole) {
        existingRole.amount += amount;
        existingRole.pct += pct;
      } else {
        existing.roles.push({ role, pct, amount });
      }
    } else {
      personMap.set(name, {
        name,
        total: amount,
        roles: [{ role, pct, amount }],
      });
    }
  }

  for (const t of data) {
    const cot = Number(t.cotizacion);
    const rate = t.moneda === "USD" ? 16 : t.moneda === "Euros" ? 19 : 1;
    const quotePesos = cot * rate;

    const pTat = Number(t.porcentaje_tatuador || 0);
    const pJal = Number(t.porcentaje_jalador || 0);
    const pGer = Number(t.porcentaje_gerente || 0);

    const gerenteName = extractName(t.gerente);
    const tatuadorName = extractName(t.tatuador);
    const jaladorName = extractName(t.jalador);

    addToPerson(tatuadorName, "Tatuador", pTat, (quotePesos * pTat) / 100);
    addToPerson(jaladorName, "Jalador", pJal, (quotePesos * pJal) / 100);
    addToPerson(gerenteName, "Gerente", pGer, (quotePesos * pGer) / 100);
  }

  const people = Array.from(personMap.values()).sort(
    (a, b) => b.total - a.total
  );

  return {
    totalPagado: people.reduce((sum, p) => sum + p.total, 0),
    people,
  };
}
