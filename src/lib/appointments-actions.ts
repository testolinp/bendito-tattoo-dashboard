"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Appointment = {
  id: number;
  name: string;
  telefono: string;
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
  fecha_cita: string;
  status: string;
};

export async function getAppointments() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_appointments");

  if (error) throw new Error(error.message);
  return data as Appointment[];
}

export async function createAppointment(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_appointment", {
    p_name: formData.get("name") as string,
    p_telefono: formData.get("telefono") as string,
    p_gerente_id: Number(formData.get("gerente_id")),
    p_tatuador_id: Number(formData.get("tatuador_id")),
    p_jalador_id: Number(formData.get("jalador_id")),
    p_cotizacion: Number(formData.get("cotizacion")),
    p_moneda: formData.get("moneda") as string,
    p_deposito_pesos: Number(formData.get("deposito_pesos") || 0),
    p_deposito_usd: Number(formData.get("deposito_usd") || 0),
    p_deposito_euros: Number(formData.get("deposito_euros") || 0),
    p_forma_pago: formData.get("forma_pago") as string,
    p_fecha_cita: formData.get("fecha_cita") as string,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/citas");
}

export async function updateAppointment(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_appointment", {
    p_id: Number(formData.get("id")),
    p_name: formData.get("name") as string,
    p_telefono: formData.get("telefono") as string,
    p_gerente_id: Number(formData.get("gerente_id")),
    p_tatuador_id: Number(formData.get("tatuador_id")),
    p_jalador_id: Number(formData.get("jalador_id")),
    p_cotizacion: Number(formData.get("cotizacion")),
    p_moneda: formData.get("moneda") as string,
    p_deposito_pesos: Number(formData.get("deposito_pesos") || 0),
    p_deposito_usd: Number(formData.get("deposito_usd") || 0),
    p_deposito_euros: Number(formData.get("deposito_euros") || 0),
    p_forma_pago: formData.get("forma_pago") as string,
    p_fecha_cita: formData.get("fecha_cita") as string,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/citas");
}

export async function cancelAppointment(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_appointment", {
    p_id: id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/citas");
}

export async function completeAppointment(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_appointment", {
    p_id: id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/citas");
  return { turnoId: data as number };
}
