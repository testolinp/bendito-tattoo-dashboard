import { notFound } from "next/navigation";
import { getCierre } from "@/lib/cierres-actions";
import CierreDetail from "@/components/CierreDetail";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cierre" };

export default async function CierreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cierreId = Number(id);
  if (!Number.isInteger(cierreId)) notFound();

  const cierre = await getCierre(cierreId);
  if (!cierre) notFound();

  return <CierreDetail cierre={cierre} />;
}
