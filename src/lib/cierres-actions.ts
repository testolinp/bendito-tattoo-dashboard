"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCuentasSummary, type CuentasSummary } from "./cuentas-actions";
import { isDateString, rangeToISO } from "./datetime-utils";

export type Cierre = {
  id: number;
  fecha_desde: string;
  fecha_hasta: string;
  created_at: string;
  snapshot: CuentasSummary;
};

const CIERRE_FIELDS = "id, fecha_desde, fecha_hasta, created_at, snapshot";

export async function getCierres(): Promise<Cierre[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cierres")
    .select(CIERRE_FIELDS)
    .order("fecha_desde", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Cierre[];
}

export async function getCierre(id: number): Promise<Cierre | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cierres")
    .select(CIERRE_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Cierre) ?? null;
}

export async function createCierre(formData: FormData) {
  const desde = formData.get("desde") as string;
  const hasta = formData.get("hasta") as string;

  if (!isDateString(desde) || !isDateString(hasta)) {
    return { error: "Seleccioná las fechas desde y hasta" };
  }
  if (desde > hasta) {
    return { error: "La fecha desde no puede ser posterior a la fecha hasta" };
  }

  const { start, end } = rangeToISO({ from: desde, to: hasta });
  const snapshot = await getCuentasSummary(start, end);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cierres")
    .insert({ fecha_desde: desde, fecha_hasta: hasta, snapshot })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/cierres");
  return { id: data.id as number };
}

export async function deleteCierre(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("cierres").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/cierres");
}
