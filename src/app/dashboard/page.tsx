import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardCards from "@/components/DashboardCards";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <h2 className="h4 mb-4">Dashboard</h2>
      <DashboardCards />
    </>);
}
