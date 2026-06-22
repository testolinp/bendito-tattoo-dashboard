import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bendito Tattoo - Dashboard",
  description: "Panel de administración de Bendito Tattoo",
  icons: [
    { rel: "icon", url: "/logo.jpeg" },
    { rel: "apple-touch-icon", url: "/logo.jpeg" },
  ],
  manifest: "/manifest",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
