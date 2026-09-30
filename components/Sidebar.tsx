// components/Sidebar.tsx
import Link from "next/link";
import { LayoutDashboard, Package, Briefcase, Calendar } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-72 bg-white border-r border-[#E5D3B3] flex flex-col shrink-0">
      <div className="h-20 flex items-center px-8 border-b border-[#E5D3B3]/40">
        <h1 className="font-serif text-2xl font-bold text-[#4A0E17] tracking-wider uppercase">
          Arasa Control
        </h1>
      </div>
      <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
        <Link href="/" className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#E5D3B3]/20 transition-colors font-medium text-sm tracking-wide">
          <LayoutDashboard size={20} className="text-[#4A0E17]" /> Dashboard
        </Link>
        <Link href="/collection" className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#E5D3B3]/20 transition-colors font-medium text-sm tracking-wide">
          <Package size={20} className="text-[#4A0E17]" /> The Collection
        </Link>
        <Link href="/career" className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#E5D3B3]/20 transition-colors font-medium text-sm tracking-wide">
          <Briefcase size={20} className="text-[#4A0E17]" /> Career
        </Link>
        <Link href="/program" className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#E5D3B3]/20 transition-colors font-medium text-sm tracking-wide">
          <Calendar size={20} className="text-[#4A0E17]" /> Program
        </Link>
      </nav>
    </aside>
  );
}