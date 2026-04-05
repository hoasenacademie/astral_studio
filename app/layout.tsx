import "../styles/globals.css";
import type { Metadata } from "next";
import { Topbar } from "@/components/topbar";

export const metadata: Metadata = {
  title: "Astral Studio Premium",
  description: "Studio premium de rapports astrologiques éditoriaux"
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
