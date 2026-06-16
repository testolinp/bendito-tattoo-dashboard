"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Turno = {
  id: number;
  name: string;
  gerente_id: number;
  gerente_name: string;
  tatuador_id: number;
  tatuador_name: string;
  jalador_id: number;
  jalador_name: string;
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
  fecha_cita: string;
  appointment_id: number | null;
};

export async function getTurnos() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_turnos");

  if (error) throw new Error(error.message);
  return data as Turno[];
}

export async function createTurno(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_turno", {
    p_name: formData.get("name") as string,
    p_gerente_id: Number(formData.get("gerente_id")),
    p_tatuador_id: Number(formData.get("tatuador_id")),
    p_jalador_id: Number(formData.get("jalador_id")),
    p_cotizacion: Number(formData.get("cotizacion")),
    p_moneda: formData.get("moneda") as string,
    p_deposito_pesos: Number(formData.get("deposito_pesos") || 0),
    p_deposito_usd: Number(formData.get("deposito_usd") || 0),
    p_deposito_euros: Number(formData.get("deposito_euros") || 0),
    p_forma_pago: formData.get("forma_pago") as string,
    p_pago_pesos: Number(formData.get("pago_pesos") || 0),
    p_pago_usd: Number(formData.get("pago_usd") || 0),
    p_pago_euros: Number(formData.get("pago_euros") || 0),
    p_pago_forma_pago: formData.get("pago_forma_pago") as string,
    p_porcentaje_tatuador: Number(formData.get("porcentaje_tatuador") || 0),
    p_porcentaje_jalador: Number(formData.get("porcentaje_jalador") || 0),
    p_porcentaje_gerente: Number(formData.get("porcentaje_gerente") || 0),
    p_fecha_cita: formData.get("fecha_cita") as string,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/turnos");
}

export async function updateTurno(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_turno", {
    p_id: Number(formData.get("id")),
    p_name: formData.get("name") as string,
    p_gerente_id: Number(formData.get("gerente_id")),
    p_tatuador_id: Number(formData.get("tatuador_id")),
    p_jalador_id: Number(formData.get("jalador_id")),
    p_cotizacion: Number(formData.get("cotizacion")),
    p_moneda: formData.get("moneda") as string,
    p_deposito_pesos: Number(formData.get("deposito_pesos") || 0),
    p_deposito_usd: Number(formData.get("deposito_usd") || 0),
    p_deposito_euros: Number(formData.get("deposito_euros") || 0),
    p_forma_pago: formData.get("forma_pago") as string,
    p_pago_pesos: Number(formData.get("pago_pesos") || 0),
    p_pago_usd: Number(formData.get("pago_usd") || 0),
    p_pago_euros: Number(formData.get("pago_euros") || 0),
    p_pago_forma_pago: formData.get("pago_forma_pago") as string,
    p_porcentaje_tatuador: Number(formData.get("porcentaje_tatuador") || 0),
    p_porcentaje_jalador: Number(formData.get("porcentaje_jalador") || 0),
    p_porcentaje_gerente: Number(formData.get("porcentaje_gerente") || 0),
    p_fecha_cita: formData.get("fecha_cita") as string,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/turnos");
}
