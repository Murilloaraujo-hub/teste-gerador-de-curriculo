import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video2MP3 — Conversor de Vídeos para MP3",
  description: "Transforme vídeos autorizados em arquivos MP3 com alta qualidade. Frontend no GitHub Pages e Backend com Python, Flask e FFmpeg no Render.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">{children}</body>
    </html>
  );
}
