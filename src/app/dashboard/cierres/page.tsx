import { getCierres } from "@/lib/cierres-actions";
import CierresTable from "@/components/CierresTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cierres" };

export default async function CierresPage() {
  const cierres = await getCierres();
  return <CierresTable cierres={cierres} />;
}
