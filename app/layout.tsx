import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: "swap" });

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
      <body className={`${openSans.variable} font-sans bg-neutral-100 text-neutral-900 flex flex-col lg:flex-row h-screen overflow-hidden`}>
        <Sidebar />
        <main className="relative flex-1 min-w-0 w-full overflow-y-auto bg-neutral-100 pb-20 lg:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}