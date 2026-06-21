import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings-actions";
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

  const settings = await getSettings();

  return (
    <DashboardShell
      isAdmin={isAdmin}
      sidebarTitle={settings.sidebar_title}
      sidebarDescription={settings.sidebar_description}
      sidebarLogoUrl={settings.sidebar_logo_url}
    >
      {children}
    </DashboardShell>
  );
}
