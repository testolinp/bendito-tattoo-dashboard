"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Egreso = {
  id: number;
  amount: number;
  payment_method: string;
  description: string;
  created_at: string;
};

export async function createEgreso(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("egresos").insert({
    amount: Number(formData.get("amount")),
    payment_method: formData.get("payment_method") as string,
    description: (formData.get("description") as string) || "",
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/cuentas");
}
