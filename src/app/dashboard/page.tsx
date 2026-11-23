import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardCards from "@/components/DashboardCards";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardCards />;
}
