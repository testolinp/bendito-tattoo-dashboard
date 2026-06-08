import { getStaff } from "@/lib/staff-actions";
import StaffTable from "@/components/StaffTable";

export default async function GerentesPage() {
  const staff = await getStaff("gerente");
  return <StaffTable staff={staff} role="gerente" title="Gerentes" />;
}
