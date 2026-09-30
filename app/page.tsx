"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, ShoppingBag, Briefcase, Clock } from "lucide-react";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"] });

export default function Dashboard() {
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCareers: 0,
    totalPrograms: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Tarik data asli dari tabel yang udah fix ada
        const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
        const { count: careerCount } = await supabase.from('careers').select('*', { count: 'exact', head: true });
        const { count: programCount } = await supabase.from('programs').select('*', { count: 'exact', head: true });
        
        setStats({
          totalProducts: productCount || 0,
          totalCareers: careerCount || 0,
          totalPrograms: programCount || 0,
        });

        // Tarik data order (Asumsi tabel 'orders' udah lu bikin di Supabase)
        const { data: orders, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (orders && !orderError) {
          setRecentOrders(orders);
        }
      } catch (error) {
        console.error("Gagal narik data database:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className={`${playfair.className} text-3xl font-bold text-[#4A0E17] mb-2`}>Dashboard Overview</h1>
        <p className="text-[#2B1B17]/60">Pantau performa Arasa Store dan kelola pesanan terbaru.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-[#E5D3B3]/40 p-6 rounded-2xl shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#2B1B17]/50 mb-1">Total Produk</p>
            <h3 className="text-2xl font-bold text-[#2B1B17]">{isLoading ? "..." : stats.totalProducts}</h3>
          </div>
        </div>

        <div className="bg-white border border-[#E5D3B3]/40 p-6 rounded-2xl shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-[#00AA5B]/10 text-[#00AA5B]">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#2B1B17]/50 mb-1">Lowongan Aktif</p>
            <h3 className="text-2xl font-bold text-[#2B1B17]">{isLoading ? "..." : stats.totalCareers}</h3>
          </div>
        </div>

        <div className="bg-white border border-[#E5D3B3]/40 p-6 rounded-2xl shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-[#4A0E17]/10 text-[#4A0E17]">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#2B1B17]/50 mb-1">Program Tersedia</p>
            <h3 className="text-2xl font-bold text-[#2B1B17]">{isLoading ? "..." : stats.totalPrograms}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E5D3B3]/40 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5D3B3]/40 flex justify-between items-center bg-[#FDFBF7]">
          <h2 className={`${playfair.className} text-xl font-bold text-[#4A0E17]`}>Pesanan Terbaru</h2>
          <button className="text-sm font-bold uppercase tracking-widest text-[#2B1B17]/50 hover:text-[#4A0E17] transition-colors">
            Lihat Semua
          </button>
        </div>
        <div className="overflow-x-auto min-h-[200px]">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-[#2B1B17]/50 border-b border-[#E5D3B3]/40">
                <th className="p-4 font-bold">Order ID</th>
                <th className="p-4 font-bold">Pelanggan</th>
                <th className="p-4 font-bold">Item</th>
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D3B3]/20">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#2B1B17]/50">Memuat data dari database...</td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#2B1B17]/50 font-medium">Belum ada data pesanan (Pastikan tabel 'orders' sudah dibuat)</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="p-4 font-semibold text-[#4A0E17]">{(order.id || '').toString().substring(0, 8).toUpperCase()}</td>
                    <td className="p-4 font-medium text-[#2B1B17]">{order.customer_name}</td>
                    <td className="p-4 text-sm text-[#2B1B17]/70 truncate max-w-[200px]">{order.items}</td>
                    <td className="p-4 font-semibold text-[#2B1B17]">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.total_price)}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        order.status === 'Selesai' ? 'bg-[#00AA5B]/10 text-[#00AA5B]' :
                        order.status === 'Diproses' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-xs text-[#2B1B17]/50 flex items-center justify-end gap-2">
                      <Clock size={12} /> {new Date(order.created_at).toLocaleDateString('id-ID')}
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