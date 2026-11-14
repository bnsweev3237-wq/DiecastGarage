import type { MetadataRoute } from "next";

// Lets phones and computers install the site as an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "theCollectorHQ",
    short_name: "CollectorHQ",
    description: "Catalog, value and show off every collection: cards, coins, comics, diecast, sneakers, toys and more.",
    id: "/",
    start_url: "/collection?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["lifestyle", "shopping", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Add an item", url: "/collection/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My collection", url: "/collection", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
