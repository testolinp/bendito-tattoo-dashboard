"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type StaffMember = {
  id: number;
  name: string;
  nickname: string;
  bank: string;
  account_number: string;
  role: "gerente" | "jalador" | "tatuador";
};

export async function getStaff(role: StaffMember["role"]) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_staff", {
    p_role: role,
  });

  if (error) throw new Error(error.message);
  return data as StaffMember[];
}

export async function createStaff(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_staff", {
    p_name: formData.get("name") as string,
    p_nickname: formData.get("nickname") as string,
    p_bank: formData.get("bank") as string,
    p_account_number: formData.get("account_number") as string,
    p_role: formData.get("role") as StaffMember["role"],
  });

  if (error) return { error: error.message };

  const role = formData.get("role") as StaffMember["role"];
  revalidatePath(`/dashboard/${role}s`);
}

export async function updateStaff(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_staff", {
    p_id: Number(formData.get("id")),
    p_name: formData.get("name") as string,
    p_nickname: formData.get("nickname") as string,
    p_bank: formData.get("bank") as string,
    p_account_number: formData.get("account_number") as string,
    p_role: formData.get("role") as StaffMember["role"],
  });

  if (error) return { error: error.message };

  const role = formData.get("role") as StaffMember["role"];
  revalidatePath(`/dashboard/${role}s`);
}

export async function deleteStaff(id: number, role: StaffMember["role"]) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_staff", {
    p_id: id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${role}s`);
}
