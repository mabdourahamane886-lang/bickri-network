import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bickri Network",
  description: "Connecter les talents, les cultures et les savoirs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
