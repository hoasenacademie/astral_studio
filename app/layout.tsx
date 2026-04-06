import "../styles/globals.css";
import type { Metadata } from "next";
import { Topbar } from "@/components/topbar";

export const metadata: Metadata = {
  title: "Astral Studio Premium",
  description: "Studio premium de rapports astrologiques editoriaux",
  icons: {
    icon: [
      { url: "/favicon/favicon.png", type: "image/png" },
      { url: "/favicon/favicon.webp", type: "image/webp" }
    ],
    shortcut: "/favicon/favicon.png",
    apple: "/favicon/favicon.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Topbar />
        {children}
      </body>
    </html>
  );
}
