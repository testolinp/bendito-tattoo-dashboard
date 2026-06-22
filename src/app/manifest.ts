import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bendito Tattoo",
    short_name: "Bendito",
    description: "Panel de administración de Bendito Tattoo",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: "/logo.jpeg", sizes: "any", type: "image/jpeg" },
    ],
  };
}
