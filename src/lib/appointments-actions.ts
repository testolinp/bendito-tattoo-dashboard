"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Appointment = {
  id: number;
  name: string;
  gerente_id: number;
  gerente_name: string;
  tatuador_id: number;
  tatuador_name: string;
  deposito: number;
  forma_pago: string;
  fecha_pago: string;
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
    p_gerente_id: Number(formData.get("gerente_id")),
    p_tatuador_id: Number(formData.get("tatuador_id")),
    p_deposito: Number(formData.get("deposito")),
    p_forma_pago: formData.get("forma_pago") as string,
    p_fecha_pago: formData.get("fecha_pago") as string,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/citas");
}

export async function deleteAppointment(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_appointment", {
    p_id: id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/citas");
}
