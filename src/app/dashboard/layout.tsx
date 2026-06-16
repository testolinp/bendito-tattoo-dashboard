import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email ?? "";
  const isAdmin = userEmail === "admin@benditotattoo.com" || user?.user_metadata?.is_admin === true;

  return (
    <DashboardShell userEmail={userEmail} isAdmin={isAdmin}>
      {children}
    </DashboardShell>
  );
}
