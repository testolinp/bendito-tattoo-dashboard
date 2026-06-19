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
    if (Array.isArray(val) && val.length > 0) {
      const item = val[0] as { nickname?: string; name?: string };
      return item.nickname || item.name || "";
    }
    if (val && typeof val === "object") {
      const item = val as { nickname?: string; name?: string };
      return item.nickname || item.name || "";
    }
    return "";
  }

  for (const t of data) {
    const cot = Number(t.cotizacion);
    const rate = t.moneda === "USD" ? 16 : t.moneda === "Euros" ? 19 : 1;
    const quotePesos = cot * rate;

    const pTat = Number(t.porcentaje_tatuador || 0);
    const pJal = Number(t.porcentaje_jalador || 0);
    const pGer = Number(t.porcentaje_gerente || 0);

    const entries: { name: string; role: "Tatuador" | "Jalador" | "Gerente"; pct: number }[] = [
      { name: extractName(t.tatuador), role: "Tatuador", pct: pTat },
      { name: extractName(t.jalador), role: "Jalador", pct: pJal },
      { name: extractName(t.gerente), role: "Gerente", pct: pGer },
    ];

    for (const { name, role, pct } of entries) {
      if (!name || pct <= 0) continue;
      const amount = (quotePesos * pct) / 100;
      if (amount <= 0) continue;

      const existing = personMap.get(name);
      if (existing) {
        existing.total += amount;
        const existingRole = existing.roles.find((r) => r.role === role);
        if (existingRole) {
          existingRole.amount += amount;
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
  }

  const people = Array.from(personMap.values()).sort(
    (a, b) => b.total - a.total
  );

  return {
    totalPagado: people.reduce((sum, p) => sum + p.total, 0),
    people,
  };
}

export async function getConfirmedNames(periodStart: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos_realizados")
    .select("person_name")
    .eq("period_start", periodStart);

  if (error) throw new Error(error.message);
  return new Set(data.map((r) => r.person_name));
}

export async function confirmPayment(
  personName: string,
  periodStart: string,
  amount: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("pagos_realizados").insert({
    person_name: personName,
    period_start: periodStart,
    amount,
    confirmed_by: user?.email ?? "",
  });

  if (error) throw new Error(error.message);
}

export async function undoConfirmPayment(personName: string, periodStart: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pagos_realizados")
    .delete()
    .eq("person_name", personName)
    .eq("period_start", periodStart);

  if (error) throw new Error(error.message);
}
