import "./globals.css";
import Providers from "../components/Providers";

export const metadata = {
  title: "Wavecraft — AI song generation",
  description: "Describe a song, get a real track back.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
