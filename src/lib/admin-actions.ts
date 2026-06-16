"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
};

export async function createUser(email: string, password: string, isAdmin: boolean) {
  const supabase = createAdminClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { is_admin: isAdmin },
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/users");
  return user;
}

export async function listUsers(): Promise<AdminUser[]> {
  const supabase = createAdminClient();

  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();

  if (error) throw new Error(error.message);

  return users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    createdAt: u.created_at,
    isAdmin: u.user_metadata?.is_admin === true,
  }));
}

export async function updateUser(id: string, data: { email?: string; isAdmin?: boolean }) {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {};
  if (data.email) updateData.email = data.email;
  if (data.isAdmin !== undefined) updateData.user_metadata = { is_admin: data.isAdmin };

  const { error } = await supabase.auth.admin.updateUserById(id, updateData);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/users");
}

export async function deleteUser(id: string, email: string) {
  if (email === "admin@benditotattoo.com") {
    throw new Error("No se puede eliminar el usuario administrador principal");
  }

  const supabase = createAdminClient();

  const { error } = await supabase.auth.admin.deleteUser(id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/users");
}
