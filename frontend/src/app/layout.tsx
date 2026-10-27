import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ChatBotModal from "@/components/ChatBotModal";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Folio — Smart Book Discovery & Reading",
  description: "AI-powered book discovery, accessible reading, and audiobooks for every kind of reader.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1C2B3A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-sans min-h-screen flex flex-col" style={{ background: '#060b14', color: '#e8dcc8' }}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <ChatBotModal />
        </AuthProvider>
      </body>
    </html>
  );
}
