"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Playfair_Display } from "next/font/google";
import * as XLSX from "xlsx";
import { ArrowLeft, Download, Users, Package, Wallet, ChefHat } from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"] });

export default function OrderDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessionDetail = async () => {
      try {
        const { data, error } = await supabase
          .from('tour_sessions')
          .select(`
            id, group_name, status, created_at,
            tour_leaders ( name ),
            tour_orders (
              id, passenger_name, seat_number,
              tour_order_items ( qty, price_at_checkout, products(name) )
            )
          `)
          .eq('id', sessionId)
          .single();

        if (error) throw error;

        const itemAggregator: Record<string, number> = {};
        let totalOmzet = 0;
        let totalItems = 0;

        const processedOrders = data.tour_orders?.map((order: any) => {
          let orderTotal = 0;
          const cleanItems = order.tour_order_items
            .filter((i: any) => i.qty > 0)
            .map((item: any) => {
              const name = item.products?.name || "Produk dihapus";
              const price = item.price_at_checkout || 0;
              const subtotal = item.qty * price;
              
              orderTotal += subtotal;
              totalOmzet += subtotal;
              totalItems += item.qty;
              
              itemAggregator[name] = (itemAggregator[name] || 0) + item.qty;
              return { name, qty: item.qty, price, subtotal };
            });

          return { ...order, cleanItems, orderTotal };
        });

        setSessionData({
          ...data,
          tour_orders: processedOrders,
          aggregatedItems: Object.entries(itemAggregator).map(([name, qty]) => ({ name, qty })),
          totalOmzet,
          totalItems
        });
      } catch (err) {
        console.error("Gagal narik detail sesi:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) fetchSessionDetail();
  }, [sessionId]);

  const handleExportExcel = () => {
    if (!sessionData) return;

    // 1. Siapin Data Sheet Rekap Dapur
    const rekapData = sessionData.aggregatedItems.map((item: any) => ({
      "Nama Barang": item.name,
      "Total Disiapkan (Pcs)": item.qty
    }));
    const wsRekap = XLSX.utils.json_to_sheet(rekapData);

    // 2. Siapin Data Sheet Packing (Layout Blok Per 4 Orang ke Bawah)
    const aoa: any[][] = [];
    const groupName = sessionData.group_name || "-";
    const passengers = sessionData.tour_orders || [];
    
    // refactored logic: Array Chunking - Potong data per 4 orang biar rapi ke bawah
    const chunkSize = 4;
    
    for (let i = 0; i < passengers.length; i += chunkSize) {
      const chunk = passengers.slice(i, i + chunkSize);
      
      // Header baris 1-3 untuk blok ini
      const rowBis: (string | number)[] = [];
      const rowUrut: (string | number)[] = [];
      const rowNama: (string | number)[] = [];

      chunk.forEach((p: any) => {
        rowBis.push("No. bis", groupName);
        rowUrut.push("No urut", p.seat_number || "-");
        rowNama.push("Nama", p.passenger_name);
      });
      aoa.push(rowBis, rowUrut, rowNama);

      // Cari orang yang pesen paling banyak di dalam blok INI aja
      let maxItems = 0;
      chunk.forEach((p: any) => {
        if (p.cleanItems.length > maxItems) maxItems = p.cleanItems.length;
      });

      // Isi baris item secara dinamis
      for (let r = 0; r < maxItems; r++) {
        const rowItem: (string | number)[] = [];
        chunk.forEach((p: any) => {
          const itemDetail = p.cleanItems[r];
          if (itemDetail) {
            rowItem.push(itemDetail.name, itemDetail.qty);
          } else {
            rowItem.push("", ""); // Filler kalau dia pesanannya dikit
          }
        });
        aoa.push(rowItem);
      }

      // Baris penutup: Total Harga
      const rowHarga: (string | number)[] = [];
      chunk.forEach((p: any) => {
        rowHarga.push("Harga", p.orderTotal);
      });
      aoa.push(rowHarga);
      
      // refactored logic: Kasih jarak 2 baris kosong antar blok biar gampang digunting
      aoa.push([]);
      aoa.push([]);
    }

    const wsPacking = XLSX.utils.aoa_to_sheet(aoa);

    // 3. Gabung & Download
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsRekap, "Rekap Dapur");
    XLSX.utils.book_append_sheet(wb, wsPacking, "Packing Indikator");

    XLSX.writeFile(wb, `Arasa_Order_${groupName.replace(/\s+/g, '_')}.xlsx`);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-[#2B1B17]/50 font-bold tracking-widest uppercase text-sm">Menyiapkan Dashboard...</p></div>;
  }

  if (!sessionData) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500 font-bold">Sesi tidak ditemukan.</p></div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen pb-24">
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4 mt-4 sm:mt-0">
        <div>
          <Link href="/order" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2B1B17]/50 hover:text-[#4A0E17] transition-colors mb-4">
            <ArrowLeft size={16} /> Kembali ke Board
          </Link>
          <h1 className={`${playfair.className} text-2xl sm:text-4xl font-bold text-[#4A0E17] mb-2`}>{sessionData.group_name}</h1>
          <p className="text-sm text-[#2B1B17]/60 flex items-center gap-2">
            TL: <strong className="text-[#2B1B17]">{sessionData.tour_leaders?.name}</strong> • 
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${sessionData.status === 'active' ? 'bg-[#00AA5B]/10 text-[#00AA5B]' : 'bg-gray-100 text-gray-500'}`}>
              {sessionData.status}
            </span>
          </p>
        </div>

        <button 
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 bg-[#00AA5B] hover:bg-[#008a4a] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-md shrink-0"
        >
          <Download size={16} /> Export Data (Excel)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white border border-[#E5D3B3]/40 p-5 sm:p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#4A0E17]/10 text-[#4A0E17]"><Wallet size={24} /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2B1B17]/50 mb-1">Total Omzet</p>
            <h3 className="text-xl font-bold text-[#2B1B17]">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(sessionData.totalOmzet)}</h3>
          </div>
        </div>
        <div className="bg-white border border-[#E5D3B3]/40 p-5 sm:p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600"><Users size={24} /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2B1B17]/50 mb-1">Total Penumpang</p>
            <h3 className="text-xl font-bold text-[#2B1B17]">{sessionData.tour_orders.length} Orang</h3>
          </div>
        </div>
        <div className="bg-white border border-[#E5D3B3]/40 p-5 sm:p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100 text-orange-600"><Package size={24} /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2B1B17]/50 mb-1">Barang Disiapkan</p>
            <h3 className="text-xl font-bold text-[#2B1B17]">{sessionData.totalItems} Pcs</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#E5D3B3]/60 rounded-2xl p-5 sm:p-6 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 mb-4 border-b border-[#E5D3B3]/40 pb-4">
              <ChefHat size={20} className="text-[#4A0E17]" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#2B1B17]">Rekap Dapur</h2>
            </div>
            
            {sessionData.aggregatedItems.length === 0 ? (
              <p className="text-center text-sm text-[#2B1B17]/40 italic py-10">Belum ada pesanan masuk.</p>
            ) : (
              <ul className="space-y-3">
                {sessionData.aggregatedItems.map((item: any, idx: number) => (
                  <li key={idx} className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-[#2B1B17]">{item.name}</span>
                    <span className="font-bold text-[#FDFBF7] bg-[#4A0E17] px-3 py-1 rounded-md text-xs">{item.qty} Pcs</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#2B1B17] mb-4">Detail Per Penumpang</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sessionData.tour_orders.map((order: any) => (
              <div key={order.id} className="bg-white border border-[#E5D3B3]/60 rounded-xl p-5 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-3 border-b border-[#E5D3B3]/20 pb-3">
                  <h5 className="font-bold text-sm text-[#4A0E17] pr-2">{order.passenger_name}</h5>
                  <span className="text-[10px] font-bold bg-[#E5D3B3]/20 text-[#2B1B17] px-2 py-0.5 rounded shrink-0">
                    Kursi {order.seat_number || "-"}
                  </span>
                </div>
                
                <div className="flex-1 min-h-[80px]">
                  {order.cleanItems.length === 0 ? (
                    <p className="text-xs text-[#2B1B17]/40 italic mt-2">Tidak ada pesanan aktif.</p>
                  ) : (
                    <ul className="space-y-2">
                      {order.cleanItems.map((item: any, i: number) => (
                        <li key={i} className="flex justify-between items-start text-xs border-b border-dashed border-[#E5D3B3]/30 pb-1.5 last:border-0">
                          <span className="text-[#2B1B17]/80 line-clamp-1 pr-2">{item.name}</span>
                          <span className="font-bold text-[#2B1B17]">x{item.qty}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E5D3B3]/40 flex justify-between items-center bg-[#FDFBF7] -mx-5 -mb-5 p-4 rounded-b-xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#2B1B17]/50">Total Tagihan</span>
                  <span className="text-sm font-bold text-[#4A0E17]">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.orderTotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}