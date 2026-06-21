"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SiteSettings = {
  sidebar_title: string;
  sidebar_description: string;
  sidebar_logo_url: string;
};

export async function getSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("sidebar_title, sidebar_description, sidebar_logo_url")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return { sidebar_title: "Bendito Tattoo", sidebar_description: "", sidebar_logo_url: "" };
  }

  return data;
}

export async function saveSettings(formData: FormData) {
  const title = formData.get("sidebar_title") as string;
  const description = formData.get("sidebar_description") as string;
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
  if (logoUrl) updateData.sidebar_logo_url = logoUrl;

  const { error } = await supabase
    .from("site_settings")
    .update(updateData)
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}
