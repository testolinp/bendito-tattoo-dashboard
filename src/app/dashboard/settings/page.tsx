"use client";

import { useEffect, useState } from "react";
import { getSettings, saveSettings, type SiteSettings } from "@/lib/settings-actions";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setTitle(s.sidebar_title);
      setDescription(s.sidebar_description);
    });
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    const fd = new FormData();
    fd.set("sidebar_title", title);
    fd.set("sidebar_description", description);
    if (file) fd.set("sidebar_logo", file);

    const result = await saveSettings(fd);
    if (result?.error) {
      setMsg("Error: " + result.error);
    } else {
      setMsg("Guardado correctamente");
      setFile(null);
    }
    setSaving(false);
  };

  return (
    <div>
      <h2 className="mb-4">Configuración</h2>

      <div className="card">
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label fw-semibold">Título del sidebar</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bendito Tattoo"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Descripción</label>
            <input
              type="text"
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tattoo & Art Studio"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Logo del sidebar</label>
            <input
              type="file"
              className="form-control"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFile}
            />
            {(logoPreview || settings?.sidebar_logo_url) && (
              <div className="mt-2">
                <img
                  src={logoPreview || settings?.sidebar_logo_url || ""}
                  alt="Logo preview"
                  className="border rounded"
                  style={{ width: 200, height: 200, objectFit: "cover" }}
                />
              </div>
            )}
          </div>

          {msg && (
            <div className={`alert ${msg.startsWith("Error") ? "alert-danger" : "alert-success"} py-2`}>
              {msg}
            </div>
          )}

          <button className="btn btn-dark" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
