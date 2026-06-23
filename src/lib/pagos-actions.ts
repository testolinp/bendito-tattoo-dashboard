"use server";

import { createClient } from "@/lib/supabase/server";

export type PersonPayment = {
  name: string;
  total: number;
  cashOnly: boolean;
  roles: { role: string; pct: number; amount: number }[];
};

export type PaymentSummary = {
  totalPagado: number;
  people: PersonPayment[];
};

export type ConfirmedInfo = {
  person_name: string;
  payment_method: string;
};

export async function getPaymentSummary(start: string, end: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("turnos")
    .select(
      `id, cotizacion, moneda,
       gerente_id, tatuador_id, jalador_id,
       porcentaje_tatuador, porcentaje_jalador, porcentaje_gerente,
       gerente:staff!gerente_id(nickname, name, cash_only),
        tatuador:staff!tatuador_id(nickname, name, cash_only),
        jalador:staff!jalador_id(nickname, name, cash_only)`
    )
    .gte("fecha_cita", start)
    .lt("fecha_cita", end);

  if (error) throw new Error(error.message);

  const personMap = new Map<string, PersonPayment>();

  function extractStaff(val: unknown): { name: string; cashOnly: boolean } | null {
    let item: { nickname?: string; name?: string; cash_only?: boolean } | null = null;
    if (Array.isArray(val) && val.length > 0) {
      item = val[0] as { nickname?: string; name?: string; cash_only?: boolean };
    } else if (val && typeof val === "object") {
      item = val as { nickname?: string; name?: string; cash_only?: boolean };
    }
    if (!item) return null;
    return {
      name: item.nickname || item.name || "",
      cashOnly: item.cash_only === true,
    };
  }

  for (const t of data) {
    const cot = Number(t.cotizacion);
    const rate = t.moneda === "USD" ? 16 : t.moneda === "Euros" ? 19 : 1;
    const quotePesos = cot * rate;

    const pTat = Number(t.porcentaje_tatuador || 0);
    const pJal = Number(t.porcentaje_jalador || 0);
    const pGer = Number(t.porcentaje_gerente || 0);

    const entries: { name: string; cashOnly: boolean; role: "Tatuador" | "Jalador" | "Gerente"; pct: number }[] = [
      { ...extractStaff(t.tatuador) ?? { name: "", cashOnly: false }, role: "Tatuador", pct: pTat },
      { ...extractStaff(t.jalador) ?? { name: "", cashOnly: false }, role: "Jalador", pct: pJal },
      { ...extractStaff(t.gerente) ?? { name: "", cashOnly: false }, role: "Gerente", pct: pGer },
    ];

    for (const { name, cashOnly, role, pct } of entries) {
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
          cashOnly,
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

export async function getConfirmedPayments(start: string, end: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos_realizados")
    .select("person_name, payment_method")
    .gte("period_start", start)
    .lt("period_start", end);

  if (error) throw new Error(error.message);
  return data as ConfirmedInfo[];
}

export async function confirmPayment(
  personName: string,
  periodStart: string,
  amount: number,
  paymentMethod: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("pagos_realizados").insert({
    person_name: personName,
    period_start: periodStart,
    amount,
    payment_method: paymentMethod,
    confirmed_by: user?.email ?? "",
  });

  if (error) throw new Error(error.message);
}

export async function undoConfirmPayment(personName: string, start: string, end: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pagos_realizados")
    .delete()
    .eq("person_name", personName)
    .gte("period_start", start)
    .lt("period_start", end);

  if (error) throw new Error(error.message);
}
