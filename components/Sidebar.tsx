"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Briefcase, Calendar, UserLock, ShoppingCart, ChevronRight, Circle } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  // refactored logic: mapping menu biar gampang dirender ke 2 mode (desktop & mobile)
  const navItems = [
    { name: "Dashboard", fullName: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Pesanan", fullName: "Monitoring Pesanan", href: "/order", icon: ShoppingCart },
    { name: "Katalog", fullName: "Katalog Produk", href: "/collection", icon: Package },
    { name: "Karier", fullName: "Manajemen Karier", href: "/career", icon: Briefcase },
    { name: "Program", fullName: "Program", href: "/program", icon: Calendar },
    { name: "Pemandu", fullName: "Manajemen Pemandu Tur", href: "/tour-leader", icon: UserLock },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR (Sembunyi di HP, muncul di layar besar) */}
      <aside className="hidden lg:flex inset-y-0 left-0 z-50 w-[276px] bg-white border-r border-neutral-200 flex-col shrink-0">
        <div className="px-7 pb-7 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 text-sm font-bold text-white shadow-sm">A</div>
            <div>
              <h1 className="font-sans text-xl font-bold tracking-wide text-neutral-950">Arasa Control</h1>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.19em] text-neutral-500">Ruang kerja internal</p>
            </div>
          </div>
          <div className="mt-7 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <div className="flex items-center justify-between">
               <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-500">Lingkungan</span>
               <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-neutral-700"><Circle size={7} fill="currentColor" /> Aktif</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-neutral-900">Pusat kendali operasional</p>
          </div>
        </div>
        <div className="px-7 pb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500">Menu utama</div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 pb-6 no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                 className={`group flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium tracking-wide transition-all ${isActive ? 'bg-neutral-950 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'}`}
              >
                <span className="flex items-center gap-4"><Icon size={19} className={isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-950"} />{item.fullName}</span>
                {isActive && <ChevronRight size={15} className="text-neutral-400" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200 px-7 py-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">Masuk sebagai</p>
          <div className="mt-3 flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-900">AD</div><div><p className="text-xs font-bold text-neutral-900">Administrator</p><p className="text-[10px] text-neutral-500">Akses penuh</p></div></div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVBAR (Muncul di HP, sembunyi di desktop) */}
      <div className="lg:hidden fixed bottom-0 left-0 z-50 w-full bg-white border-t border-neutral-200 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] pb-1 sm:pb-2">
        <nav className="flex overflow-x-auto no-scrollbar px-2 py-1.5 snap-x snap-mandatory">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`snap-center flex flex-col items-center justify-center min-w-[76px] px-2 py-2 rounded-xl transition-all ${isActive ? 'text-neutral-950' : 'text-neutral-400 hover:text-neutral-700'}`}
              >
                <div className={`p-1.5 rounded-xl mb-1 transition-colors ${isActive ? 'bg-neutral-100 scale-110' : 'bg-transparent'}`}>
                  <Icon size={20} className={isActive ? "text-neutral-950" : "text-neutral-400"} />
                </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-neutral-950' : 'text-neutral-400'}`}>
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