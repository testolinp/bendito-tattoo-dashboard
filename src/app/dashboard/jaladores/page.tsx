import { getStaff } from "@/lib/staff-actions";
import StaffTable from "@/components/StaffTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Jaladores" };

export default async function JaladoresPage() {
  const staff = await getStaff("jalador");
  return <StaffTable staff={staff} role="jalador" title="Jaladores" />;
}
