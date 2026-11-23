import { getStaff } from "@/lib/staff-actions";
import StaffTable from "@/components/StaffTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tatuadores" };

export default async function TatuadoresPage() {
  const staff = await getStaff("tatuador");
  return <StaffTable staff={staff} role="tatuador" title="Tatuadores" />;
}
