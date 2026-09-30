// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: "Arasa Control Panel",
  description: "Web Control Internal Arasa Store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-[#F5F0E6] text-[#2B1B17] flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#FDFBF7]">
          {children}
        </main>
      </body>
    </html>
  );
}