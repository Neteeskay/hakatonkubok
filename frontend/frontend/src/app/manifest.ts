import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Помогать проСТО",
    short_name: "ПроСТО",
    description: "Корпоративная волонтёрская платформа СТОЛОТО",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffdf0",
    theme_color: "#FFE300",
    orientation: "portrait",
    lang: "ru",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/pwa/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}