"use client";

import { useEffect, useState } from "react";
import { getSettings, saveSettings, type SiteSettings } from "@/lib/settings-actions";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sidebarBaseColor, setSidebarBaseColor] = useState("#212529");
  const [sidebarTextColor, setSidebarTextColor] = useState("#ffffff");
  const [sidebarBorderColor, setSidebarBorderColor] = useState("#495057");
  const [sidebarTitleColor, setSidebarTitleColor] = useState("#ffffff");
  const [sidebarDescriptionColor, setSidebarDescriptionColor] = useState("#ced4da");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setTitle(s.sidebar_title);
      setDescription(s.sidebar_description);
      setSidebarBaseColor(s.sidebar_base_color);
      setSidebarTextColor(s.sidebar_text_color);
      setSidebarBorderColor(s.sidebar_border_color);
      setSidebarTitleColor(s.sidebar_title_color);
      setSidebarDescriptionColor(s.sidebar_description_color);
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
    fd.set("sidebar_base_color", sidebarBaseColor);
    fd.set("sidebar_text_color", sidebarTextColor);
    fd.set("sidebar_border_color", sidebarBorderColor);
    fd.set("sidebar_title_color", sidebarTitleColor);
    fd.set("sidebar_description_color", sidebarDescriptionColor);
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

      <div className="card mb-4">
        <div className="card-header fw-bold">Sidebar</div>
        <div className="card-body">
          <h6 className="fw-semibold mb-3">Contenido</h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Título</label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bendito Tattoo"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Descripción</label>
              <input
                type="text"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tattoo & Art Studio"
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Logo</label>
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
          </div>

          <hr className="my-4" />
          <h6 className="fw-semibold mb-3">Colores</h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Fondo</label>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="color"
                  className="form-control form-control-color"
                  value={sidebarBaseColor}
                  onChange={(e) => setSidebarBaseColor(e.target.value)}
                  style={{ width: 60, height: 38 }}
                />
                <input
                  type="text"
                  className="form-control"
                  value={sidebarBaseColor}
                  onChange={(e) => setSidebarBaseColor(e.target.value)}
                  placeholder="#212529"
                  style={{ maxWidth: 170 }}
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Texto general</label>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="color"
                  className="form-control form-control-color"
                  value={sidebarTextColor}
                  onChange={(e) => setSidebarTextColor(e.target.value)}
                  style={{ width: 60, height: 38 }}
                />
                <input
                  type="text"
                  className="form-control"
                  value={sidebarTextColor}
                  onChange={(e) => setSidebarTextColor(e.target.value)}
                  placeholder="#ffffff"
                  style={{ maxWidth: 170 }}
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Título</label>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="color"
                  className="form-control form-control-color"
                  value={sidebarTitleColor}
                  onChange={(e) => setSidebarTitleColor(e.target.value)}
                  style={{ width: 60, height: 38 }}
                />
                <input
                  type="text"
                  className="form-control"
                  value={sidebarTitleColor}
                  onChange={(e) => setSidebarTitleColor(e.target.value)}
                  placeholder="#ffffff"
                  style={{ maxWidth: 170 }}
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Descripción</label>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="color"
                  className="form-control form-control-color"
                  value={sidebarDescriptionColor}
                  onChange={(e) => setSidebarDescriptionColor(e.target.value)}
                  style={{ width: 60, height: 38 }}
                />
                <input
                  type="text"
                  className="form-control"
                  value={sidebarDescriptionColor}
                  onChange={(e) => setSidebarDescriptionColor(e.target.value)}
                  placeholder="#ced4da"
                  style={{ maxWidth: 170 }}
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Bordes</label>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="color"
                  className="form-control form-control-color"
                  value={sidebarBorderColor}
                  onChange={(e) => setSidebarBorderColor(e.target.value)}
                  style={{ width: 60, height: 38 }}
                />
                <input
                  type="text"
                  className="form-control"
                  value={sidebarBorderColor}
                  onChange={(e) => setSidebarBorderColor(e.target.value)}
                  placeholder="#495057"
                  style={{ maxWidth: 170 }}
                />
              </div>
            </div>
          </div>
        </div>
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
  );
}
