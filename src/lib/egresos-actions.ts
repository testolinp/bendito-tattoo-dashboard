"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Egreso = {
  id: number;
  amount: number;
  payment_method: string;
  description: string;
  date: string;
};

export async function createEgreso(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("egresos").insert({
    amount: Number(formData.get("amount")),
    payment_method: formData.get("payment_method") as string,
    description: (formData.get("description") as string) || "",
    date: (formData.get("date") as string) || new Date().toISOString().slice(0, 10),
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/cuentas");
}

export async function updateEgreso(formData: FormData) {
  const id = Number(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("egresos")
    .update({
      amount: Number(formData.get("amount")),
      payment_method: formData.get("payment_method") as string,
      description: (formData.get("description") as string) || "",
      date: (formData.get("date") as string) || new Date().toISOString().slice(0, 10),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/cuentas");
}
