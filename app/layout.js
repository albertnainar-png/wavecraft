import "./globals.css";
import Providers from "../components/Providers";

export const metadata = {
  title: "Albert's AI Song Studio",
  description: "Create original songs with an open-source AI music engine.",
  applicationName: "Albert's AI Song Studio",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "AI Song Studio", statusBarStyle: "black-translucent" },
};

export const viewport = {
  themeColor: "#101019",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
