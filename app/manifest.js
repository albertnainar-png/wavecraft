export default function manifest() {
  return {
    id: "/",
    name: "Albert's AI Song Studio",
    short_name: "Song Studio",
    description: "Create original vocal songs and instrumentals.",
    start_url: "/",
    display: "standalone",
    background_color: "#101019",
    theme_color: "#101019",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
    ],
  };
}
