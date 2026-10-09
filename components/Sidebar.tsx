"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Briefcase, Calendar, UserLock, ShoppingCart } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  // refactored logic: mapping menu biar gampang dirender ke 2 mode (desktop & mobile)
  const navItems = [
    { name: "Dashboard", fullName: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Order", fullName: "Pesanan / Order", href: "/order", icon: ShoppingCart },
    { name: "Katalog", fullName: "The Collection", href: "/collection", icon: Package },
    { name: "Karir", fullName: "Career", href: "/career", icon: Briefcase },
    { name: "Program", fullName: "Program", href: "/program", icon: Calendar },
    { name: "TL", fullName: "Tour Leader", href: "/tour-leader", icon: UserLock },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR (Sembunyi di HP, muncul di layar besar) */}
      <aside className="hidden lg:flex inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E5D3B3] flex-col shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-[#E5D3B3]/40">
          <h1 className="font-serif text-2xl font-bold text-[#4A0E17] tracking-wider uppercase">
            Arasa Control
          </h1>
        </div>
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-medium text-sm tracking-wide ${isActive ? 'bg-[#E5D3B3]/20 text-[#4A0E17]' : 'hover:bg-[#E5D3B3]/10 text-[#2B1B17]/70'}`}
              >
                <Icon size={20} className={isActive ? "text-[#4A0E17]" : "text-[#2B1B17]/50"} /> 
                {item.fullName}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE BOTTOM NAVBAR (Muncul di HP, sembunyi di desktop) */}
      <div className="lg:hidden fixed bottom-0 left-0 z-50 w-full bg-white border-t border-[#E5D3B3]/60 shadow-[0_-10px_30px_rgba(43,27,23,0.05)] pb-1 sm:pb-2">
        <nav className="flex overflow-x-auto no-scrollbar px-2 py-1.5 snap-x snap-mandatory">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`snap-center flex flex-col items-center justify-center min-w-[76px] px-2 py-2 rounded-xl transition-all ${isActive ? 'text-[#4A0E17]' : 'text-[#2B1B17]/40 hover:text-[#2B1B17]/70'}`}
              >
                <div className={`p-1.5 rounded-xl mb-1 transition-colors ${isActive ? 'bg-[#E5D3B3]/30 scale-110' : 'bg-transparent'}`}>
                  <Icon size={20} className={isActive ? "text-[#4A0E17]" : "text-[#2B1B17]/50"} />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-[#4A0E17]' : 'text-[#2B1B17]/50'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}