import { getStaff } from "@/lib/staff-actions";
import { getTurnos } from "@/lib/turnos-actions";
import TurnosTable from "@/components/TurnosTable";

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [[turnos, gerentes, tatuadores, jaladores], params] = await Promise.all([
    Promise.all([
      getTurnos(),
      getStaff("gerente"),
      getStaff("tatuador"),
      getStaff("jalador"),
    ]),
    searchParams,
  ]);

  const editTurnoId = params.editTurnoId
    ? Number(params.editTurnoId)
    : null;

  return (
    <TurnosTable
      turnos={turnos}
      gerentes={gerentes}
      tatuadores={tatuadores}
      jaladores={jaladores}
      editTurnoId={editTurnoId}
    />
  );
}
