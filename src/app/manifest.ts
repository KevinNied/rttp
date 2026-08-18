import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RTTP - Return To The Prime",
    short_name: "RTTP",
    description: "La plataforma de entrenamiento para atletas y entrenadores.",
    start_url: "/",
    display: "standalone",
    background_color: "#07080b",
    theme_color: "#07080b",
    icons: [
      {
        src: "/icon.png",
        sizes: "768x768",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "768x768",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon.png",
        sizes: "768x768",
        type: "image/png",
      },
    ],
  };
}
