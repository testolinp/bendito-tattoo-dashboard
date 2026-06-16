"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(
  prevState: { error: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { data: authData, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  const userEmail = authData.user?.email ?? "";
  const isAdmin = userEmail === "admin@benditotattoo.com" || authData.user?.user_metadata?.is_admin === true;

  revalidatePath("/dashboard");
  redirect(isAdmin ? "/dashboard" : "/dashboard/turnos");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/login");
  redirect("/login");
}
