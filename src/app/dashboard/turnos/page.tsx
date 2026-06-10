import { getStaff } from "@/lib/staff-actions";
import { getTurnos } from "@/lib/turnos-actions";
import TurnosTable from "@/components/TurnosTable";

export default async function TurnosPage() {
  const [turnos, gerentes, tatuadores, jaladores] = await Promise.all([
    getTurnos(),
    getStaff("gerente"),
    getStaff("tatuador"),
    getStaff("jalador"),
  ]);

  return (
    <TurnosTable
      turnos={turnos}
      gerentes={gerentes}
      tatuadores={tatuadores}
      jaladores={jaladores}
    />
  );
}
