"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SiteSettings = {
  sidebar_title: string;
  sidebar_description: string;
  sidebar_logo_url: string;
  sidebar_base_color: string;
  sidebar_text_color: string;
  sidebar_border_color: string;
  sidebar_title_color: string;
  sidebar_description_color: string;
};

export async function getSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("sidebar_title, sidebar_description, sidebar_logo_url, sidebar_base_color, sidebar_text_color, sidebar_border_color, sidebar_title_color, sidebar_description_color")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return { sidebar_title: "Bendito Tattoo", sidebar_description: "", sidebar_logo_url: "", sidebar_base_color: "#212529", sidebar_text_color: "#ffffff", sidebar_border_color: "#495057", sidebar_title_color: "#ffffff", sidebar_description_color: "#ced4da" };
  }

  return data;
}

export async function saveSettings(formData: FormData) {
  const title = formData.get("sidebar_title") as string;
  const description = formData.get("sidebar_description") as string;
  const sidebarBaseColor = formData.get("sidebar_base_color") as string;
  const sidebarTextColor = formData.get("sidebar_text_color") as string;
  const sidebarBorderColor = formData.get("sidebar_border_color") as string;
  const sidebarTitleColor = formData.get("sidebar_title_color") as string;
  const sidebarDescriptionColor = formData.get("sidebar_description_color") as string;
  const logoFile = formData.get("sidebar_logo") as File | null;

  const supabase = await createClient();
  let logoUrl = "";

  if (logoFile && logoFile.size > 0) {
    const supabaseAdmin = createAdminClient();

    const { error: bucketError } = await supabaseAdmin.storage.getBucket("site-images");
    if (bucketError) {
      const { error: createError } = await supabaseAdmin.storage.createBucket("site-images", {
        public: true,
        fileSizeLimit: 524288,
      });
      if (createError) return { error: createError.message };
    }

    const ext = logoFile.name.split(".").pop() || "jpg";
    const fileName = `sidebar-logo.${ext}`;

    // Remove old file if it exists (extensionless or different extension)
    await supabaseAdmin.storage.from("site-images").remove(["sidebar-logo"]);
    await supabaseAdmin.storage.from("site-images").remove([`sidebar-logo.${ext}`]);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("site-images")
      .upload(fileName, logoFile);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: uploadError.message };
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("site-images")
      .getPublicUrl(fileName);

    logoUrl = urlData?.publicUrl || "";
  }

  const updateData: Record<string, string> = {};
  if (title) updateData.sidebar_title = title;
  updateData.sidebar_description = description ?? "";
  updateData.sidebar_base_color = sidebarBaseColor ?? "#212529";
  updateData.sidebar_text_color = sidebarTextColor ?? "#ffffff";
  updateData.sidebar_border_color = sidebarBorderColor ?? "#495057";
  updateData.sidebar_title_color = sidebarTitleColor ?? "#ffffff";
  updateData.sidebar_description_color = sidebarDescriptionColor ?? "#ced4da";
  if (logoUrl) updateData.sidebar_logo_url = logoUrl;

  const { error } = await supabase
    .from("site_settings")
    .update(updateData)
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}
