"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Playfair_Display } from "next/font/google";
import Link from "next/link";
import { RefreshCw, PackageOpen, Search, Filter, Eye, Users } from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"] });

export default function OrderMonitoringPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tour_sessions')
        .select(`
          id, group_name, status, created_at,
          tour_leaders ( name ),
          tour_orders ( id )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processed = (data || []).map(session => ({
        ...session,
        total_peserta: session.tour_orders?.length || 0,
      }));

      setSessions(processed);
      applyFilters(processed, searchQuery, statusFilter);
    } catch (err) {
      console.error("Gagal narik data KDS:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (data: any[], search: string, filter: string) => {
    let result = data;
    if (filter !== "all") result = result.filter(s => s.status === filter);
    if (search.trim() !== "") {
      const lowerQuery = search.toLowerCase();
      result = result.filter(s => 
        s.group_name?.toLowerCase().includes(lowerQuery) ||
        s.tour_leaders?.name?.toLowerCase().includes(lowerQuery)
      );
    }
    setFilteredSessions(result);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters(sessions, searchQuery, statusFilter);
  }, [searchQuery, statusFilter, sessions]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6 sm:mb-8 mt-4 sm:mt-0">
        <div>
          <h1 className={`${playfair.className} text-2xl sm:text-3xl font-bold text-[#4A0E17] mb-1 sm:mb-2`}>Fulfillment Board</h1>
          <p className="text-[#2B1B17]/60 text-xs sm:text-sm">Pantau dan siapkan pesanan rombongan (Auto-refresh 1 menit).</p>
        </div>
        
        <button 
          onClick={fetchOrders}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-[#2B1B17] font-bold uppercase tracking-widest bg-white px-4 py-2.5 rounded-full border border-[#E5D3B3]/40 shadow-sm hover:bg-[#E5D3B3]/20 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin text-[#4A0E17]" : "text-[#4A0E17]"} />
          {isLoading ? "Memuat..." : "Refresh"}
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#E5D3B3]/40 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Cari Rombongan atau TL..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FDFBF7] border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] text-sm"
          />
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2B1B17]/40" />
        </div>
        <div className="relative min-w-[200px]">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FDFBF7] border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] text-sm appearance-none font-medium text-[#2B1B17]"
          >
            <option value="all">Semua Status</option>
            <option value="active">Berjalan (Active)</option>
            <option value="locked">Selesai (Locked)</option>
          </select>
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2B1B17]/40" />
        </div>
      </div>

      <div className="bg-white border border-[#E5D3B3]/40 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-[#F5F0E6] text-xs uppercase tracking-widest text-[#2B1B17]/60 border-b border-[#E5D3B3]/40">
                <th className="p-4 font-bold">Rombongan</th>
                <th className="p-4 font-bold">Tour Leader</th>
                <th className="p-4 font-bold text-center">Peserta</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D3B3]/20">
              {isLoading && filteredSessions.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-sm text-[#2B1B17]/50"><RefreshCw className="animate-spin mx-auto mb-2 text-[#E5D3B3]" size={24} /> Memuat data...</td></tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <PackageOpen size={40} className="text-[#E5D3B3] mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-[#2B1B17] mb-1">Data Kosong</h3>
                    <p className="text-[#2B1B17]/60 text-sm">Tidak ada rombongan yang sesuai filter.</p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-[#2B1B17] text-sm">{session.group_name || "Tanpa Nama"}</p>
                      <p className="text-[10px] text-[#2B1B17]/40 font-mono mt-0.5">ID: {session.id.substring(0,8)}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-sm text-[#2B1B17]/80">{session.tour_leaders?.name || "-"}</p>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-[#4A0E17]">
                        <Users size={16} className="text-[#E5D3B3]" />
                        {session.total_peserta} <span className="text-xs font-normal text-[#2B1B17]/50">Orang</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        session.status === 'active' ? 'bg-[#00AA5B]/10 text-[#00AA5B]' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {session.status === 'active' ? 'Berjalan' : 'Selesai'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link 
                        href={`/order/${session.id}`}
                        className="inline-flex items-center gap-2 bg-[#4A0E17]/5 hover:bg-[#4A0E17]/10 text-[#4A0E17] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
                      >
                        <Eye size={14} /> Detail
                      </Link>
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