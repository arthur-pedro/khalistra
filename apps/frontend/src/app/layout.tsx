import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khalistra | Estratégias Rituais",
  description:
    "Experimente a variante arcana inspirada no Chaturanga, onde cada duelo molda novas regras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
