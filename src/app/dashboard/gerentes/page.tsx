import { getStaff } from "@/lib/staff-actions";
import StaffTable from "@/components/StaffTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gerentes" };

export default async function GerentesPage() {
  const staff = await getStaff("gerente");
  return <StaffTable staff={staff} role="gerente" title="Gerentes" />;
}
