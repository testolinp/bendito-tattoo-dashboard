import { getStaff } from "@/lib/staff-actions";
import StaffTable from "@/components/StaffTable";

export default async function JaladoresPage() {
  const staff = await getStaff("jalador");
  return <StaffTable staff={staff} role="jalador" title="Jaladores" />;
}
