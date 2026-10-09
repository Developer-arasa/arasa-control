"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Wallet, Users, Activity } from "lucide-react";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"] });

export default function Dashboard() {
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalOmzet: 0, activeSessions: 0, activeTLs: 0 });
  const [isLoading, setIsLoading] = useState(true);
  // state untuk loading seeder
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const { count: sessionCount } = await supabase.from('tour_sessions').select('*', { count: 'exact', head: true }).eq('status', 'active');
        const { count: tlCount } = await supabase.from('tour_leaders').select('*', { count: 'exact', head: true }).eq('is_active', 1);
        
        const { data: orderItems } = await supabase.from('tour_order_items').select('qty, price_at_checkout');
        const totalOmzet = orderItems?.reduce((acc, curr) => acc + (curr.qty * curr.price_at_checkout), 0) || 0;

        setStats({
          totalOmzet,
          activeSessions: sessionCount || 0,
          activeTLs: tlCount || 0,
        });

        const { data: sessions } = await supabase
          .from('tour_sessions')
          .select(`id, group_name, status, created_at, tour_leaders(name)`)
          .order('created_at', { ascending: false })
          .limit(6);
          
        if (sessions) setRecentSessions(sessions);
      } catch (error) {
        console.error("Gagal narik data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
 

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-10 mt-4 sm:mt-0">
        <h1 className={`${playfair.className} text-2xl sm:text-3xl font-bold text-[#4A0E17] mb-2`}>Executive Dashboard</h1>
        <p className="text-sm text-[#2B1B17]/60">Pantau performa omzet B2B dan aktivitas rombongan hari ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div className="bg-white border border-[#E5D3B3]/40 p-5 sm:p-6 rounded-2xl shadow-sm flex items-center gap-4 sm:gap-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 bg-[#4A0E17]/10 text-[#4A0E17]">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#2B1B17]/50 mb-1">Total Omzet B2B</p>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2B1B17]">
              {isLoading ? "..." : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.totalOmzet)}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-[#E5D3B3]/40 p-5 sm:p-6 rounded-2xl shadow-sm flex items-center gap-4 sm:gap-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 bg-[#00AA5B]/10 text-[#00AA5B]">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#2B1B17]/50 mb-1">Sesi Aktif</p>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2B1B17]">{isLoading ? "..." : stats.activeSessions} Sesi</h3>
          </div>
        </div>
        
        <div className="bg-white border border-[#E5D3B3]/40 p-5 sm:p-6 rounded-2xl shadow-sm flex items-center gap-4 sm:gap-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#2B1B17]/50 mb-1">TL Aktif</p>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2B1B17]">{isLoading ? "..." : stats.activeTLs} Orang</h3>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E5D3B3]/40 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E5D3B3]/40 flex justify-between items-center bg-[#FDFBF7]">
          <h2 className={`${playfair.className} text-lg sm:text-xl font-bold text-[#4A0E17]`}>Sesi Rombongan Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[600px]">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-[#2B1B17]/50 border-b border-[#E5D3B3]/40">
                <th className="p-4 font-bold">Session ID</th>
                <th className="p-4 font-bold">Rombongan</th>
                <th className="p-4 font-bold">Tour Leader</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-right">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D3B3]/20">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-[#2B1B17]/50">Memuat data...</td></tr>
              ) : recentSessions.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-[#2B1B17]/50">Belum ada sesi rombongan</td></tr>
              ) : (
                recentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-[#FDFBF7] transition-colors text-sm">
                    <td className="p-4 font-semibold text-[#4A0E17]">{(session.id || '').toString().substring(0, 8).toUpperCase()}</td>
                    <td className="p-4 font-medium text-[#2B1B17]">{session.group_name || "Tanpa Nama"}</td>
                    <td className="p-4 text-[#2B1B17]/70">{session.tour_leaders?.name || "-"}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        session.status === 'active' ? 'bg-[#00AA5B]/10 text-[#00AA5B] animate-pulse' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {session.status === 'active' ? 'Berjalan' : 'Selesai'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-xs text-[#2B1B17]/50">
                      {new Date(session.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}