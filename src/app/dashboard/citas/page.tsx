import { getStaff } from "@/lib/staff-actions";
import { getAppointments } from "@/lib/appointments-actions";
import { createClient } from "@/lib/supabase/server";
import CitasTable from "@/components/CitasTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Citas" };

export default async function CitasPage() {
  const [appointments, gerentes, tatuadores, jaladores, supabase] =
    await Promise.all([
      getAppointments(),
      getStaff("gerente"),
      getStaff("tatuador"),
      getStaff("jalador"),
      createClient(),
    ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin =
    user?.email === "admin@benditotattoo.com" ||
    user?.user_metadata?.is_admin === true;

  return (
    <CitasTable
      appointments={appointments}
      gerentes={gerentes}
      tatuadores={tatuadores}
      jaladores={jaladores}
      isAdmin={isAdmin}
    />
  );
}
