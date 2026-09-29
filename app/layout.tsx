import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bickri Network",
  description: "Le réseau social qui connecte les talents, les cultures et les savoirs.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
