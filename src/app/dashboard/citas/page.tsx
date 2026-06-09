import { getStaff } from "@/lib/staff-actions";
import { getAppointments } from "@/lib/appointments-actions";
import CitasTable from "@/components/CitasTable";

export default async function CitasPage() {
  const [appointments, gerentes, tatuadores, jaladores] = await Promise.all([
    getAppointments(),
    getStaff("gerente"),
    getStaff("tatuador"),
    getStaff("jalador"),
  ]);

  return (
    <CitasTable
      appointments={appointments}
      gerentes={gerentes}
      tatuadores={tatuadores}
      jaladores={jaladores}
    />
  );
}
