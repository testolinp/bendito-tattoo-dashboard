import { getStaff } from "@/lib/staff-actions";
import { getAppointments } from "@/lib/appointments-actions";
import CitasTable from "@/components/CitasTable";

export default async function CitasPage() {
  const [appointments, gerentes, tatuadores] = await Promise.all([
    getAppointments(),
    getStaff("gerente"),
    getStaff("tatuador"),
  ]);

  return (
    <CitasTable
      appointments={appointments}
      gerentes={gerentes}
      tatuadores={tatuadores}
    />
  );
}
