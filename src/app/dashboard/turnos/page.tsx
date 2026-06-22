import { getStaff } from "@/lib/staff-actions";
import { getTurnos } from "@/lib/turnos-actions";
import { createClient } from "@/lib/supabase/server";
import TurnosTable from "@/components/TurnosTable";

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [[turnos, gerentes, tatuadores, jaladores], params, supabase] = await Promise.all([
    Promise.all([
      getTurnos(),
      getStaff("gerente"),
      getStaff("tatuador"),
      getStaff("jalador"),
    ]),
    searchParams,
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user?.email === "admin@benditotattoo.com" || user?.user_metadata?.is_admin === true;

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
      isAdmin={isAdmin}
    />
  );
}
