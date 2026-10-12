"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { 
  ArrowLeft, Download, Users, Package, Wallet, 
  ChefHat, Printer, Table, UserCheck, ChevronDown 
} from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"dapur" | "matriks" | "detail">("dapur");
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const [printMode, setPrintMode] = useState<"dapur" | "pesanan" | "kupon">("dapur");
  const printMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setIsPrintMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSessionDetail = async () => {
      try {
        const { data, error } = await supabase
          .from('tour_sessions')
          .select(`
            id, group_name, status, created_at,
            tour_leaders ( name ),
            tour_orders (
              id, passenger_name, bus_number, seat_number,
              tour_order_items ( qty, price_at_checkout, products(name) )
            )
          `)
          .eq('id', sessionId)
          .single();

        if (error) throw error;

        const itemAggregator: Record<string, number> = {};
        let totalOmzet = 0;
        let totalItems = 0;

        const processedOrders = (data.tour_orders || []).map((order: any) => {
          let orderTotal = 0;
          const itemMap: Record<string, number> = {};

          const cleanItems = (order.tour_order_items || [])
            .filter((i: any) => i.qty > 0)
            .map((item: any) => {
              const name = item.products?.name || "Produk dihapus";
              const price = item.price_at_checkout || 0;
              const subtotal = item.qty * price;
              
              orderTotal += subtotal;
              totalOmzet += subtotal;
              totalItems += item.qty;
              
              itemAggregator[name] = (itemAggregator[name] || 0) + item.qty;
              itemMap[name] = (itemMap[name] || 0) + item.qty;

              return { name, qty: item.qty, price, subtotal };
            });

          return { 
            ...order, 
            bus_number: order.bus_number || "1",
            cleanItems, 
            itemMap, 
            orderTotal 
          };
        });

        const aggregatedItems = Object.entries(itemAggregator).map(([name, qty]) => ({ name, qty }));
        const productColumns = aggregatedItems.map(item => item.name);

        setSessionData({
          ...data,
          tour_orders: processedOrders,
          aggregatedItems,
          productColumns,
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

  const handleTriggerPrint = (mode: "dapur" | "pesanan" | "kupon") => {
    setPrintMode(mode);
    setIsPrintMenuOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportExcel = () => {
    if (!sessionData) return;

    const groupName = sessionData.group_name || "-";
    const passengers = sessionData.tour_orders || [];
    const productCols: string[] = sessionData.productColumns || [];

    // 1. Sheet Rekap Dapur
    const rekapData = sessionData.aggregatedItems.map((item: any) => ({
      "Nama Barang": item.name,
      "Total Disiapkan (Pcs)": item.qty
    }));
    const wsRekap = XLSX.utils.json_to_sheet(rekapData);

    // 2. Sheet Rekap Pesanan
    const matrixHeaders = ["No", "Nama", ...productCols, "Harga"];
    const matrixRows: any[][] = [matrixHeaders];

    passengers.forEach((p: any, idx: number) => {
      const row: any[] = [
        idx + 1,
        p.passenger_name,
        ...productCols.map(col => p.itemMap?.[col] || ""),
        p.orderTotal
      ];
      matrixRows.push(row);
    });
    const wsMatrix = XLSX.utils.aoa_to_sheet(matrixRows);

    // 3. Sheet Kupon Packing
    const aoa: any[][] = [];
    const chunkSize = 3;
    
    for (let i = 0; i < passengers.length; i += chunkSize) {
      const chunk = passengers.slice(i, i + chunkSize);
      
      const rowRombongan: any[] = [];
      const rowBusKursi: any[] = [];
      const rowNama: any[] = [];

      chunk.forEach((p: any) => {
        rowRombongan.push("Nama Rombongan :", groupName, "", "");
        rowBusKursi.push("No Bus", p.bus_number || "1", "no Kursi", p.seat_number || "-");
        rowNama.push("nama Penumpang", p.passenger_name, "", "");
      });
      aoa.push(rowRombongan, rowBusKursi, rowNama);

      let maxItems = 0;
      chunk.forEach((p: any) => {
        if (p.cleanItems.length > maxItems) maxItems = p.cleanItems.length;
      });

      for (let r = 0; r < maxItems; r++) {
        const rowItem: any[] = [];
        chunk.forEach((p: any) => {
          const itemDetail = p.cleanItems[r];
          if (itemDetail) {
            rowItem.push(itemDetail.name, itemDetail.qty, "", "");
          } else {
            rowItem.push("", "", "", "");
          }
        });
        aoa.push(rowItem);
      }

      const rowHarga: any[] = [];
      chunk.forEach((p: any) => {
        rowHarga.push("TOTAL", p.orderTotal, "", "");
      });
      aoa.push(rowHarga);
      aoa.push([]);
      aoa.push([]);
    }

    const wsPacking = XLSX.utils.aoa_to_sheet(aoa);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsRekap, "Rekap Dapur");
    XLSX.utils.book_append_sheet(wb, wsMatrix, "Rekap Pesanan");
    XLSX.utils.book_append_sheet(wb, wsPacking, "Kupon Packing");

    XLSX.writeFile(wb, `Arasa_Order_${groupName.replace(/\s+/g, '_')}.xlsx`);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-[#404040]/50 font-bold tracking-widest uppercase text-sm">Menyiapkan Dashboard...</p></div>;
  }

  if (!sessionData) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-neutral-700 font-bold">Sesi tidak ditemukan.</p></div>;
  }

  // Filter penumpang yang punya pesanan aktif & potong per 3 orang (1 baris = 3 kolom) untuk Kupon Print
  const activeOrders = (sessionData.tour_orders || []).filter((o: any) => o.cleanItems.length > 0);
  const couponRows: any[][] = [];
  for (let i = 0; i < activeOrders.length; i += 3) {
    couponRows.push(activeOrders.slice(i, i + 3));
  }

  return (
    <>
      {/* refactored logic: kunci per baris (coupon-row) agar rata bawah & tidak terpotong di tengah halaman */}
      <style media="print">{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        nav, header, footer, aside, .fixed, .sticky {
          display: none !important;
        }
        body {
          background: white !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .coupon-row {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      `}</style>

      {/* ==================== TAMPILAN LAYAR UTAMA (HIDDEN SAAT PRINT) ==================== */}
      <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen pb-24 print:hidden">
        
        {/* Header & Tombol Aksi */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4 mt-4 sm:mt-0">
          <div>
            <Link href="/order" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#404040]/50 hover:text-[#171717] transition-colors mb-4">
              <ArrowLeft size={16} /> Kembali ke Board
            </Link>
            <h1 className="text-2xl sm:text-4xl font-bold text-neutral-950 mb-2">{sessionData.group_name}</h1>
            <p className="text-sm text-[#404040]/60 flex items-center gap-2">
              TL: <strong className="text-[#404040]">{sessionData.tour_leaders?.name}</strong> •
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${sessionData.status === 'active' ? 'bg-[#525252]/10 text-[#525252]' : 'bg-gray-100 text-gray-500'}`}>
                {sessionData.status}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 bg-[#525252] hover:bg-[#008a4a] text-white px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-md"
            >
              <Download size={16} /> Export Data (Excel)
            </button>

            <div className="relative" ref={printMenuRef}>
              <button
                onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                className="flex items-center justify-center gap-2 bg-[#171717] hover:bg-[#404040] text-white px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-md"
              >
                <Printer size={16} /> Print <ChevronDown size={14} className={`transition-transform ${isPrintMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isPrintMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E5E5E5] rounded-2xl shadow-xl py-2 z-50 overflow-hidden">
                  <button
                    onClick={() => handleTriggerPrint("dapur")}
                    className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#404040] hover:bg-[#F5F5F5] hover:text-[#171717] flex items-center gap-2.5 transition-colors"
                  >
                    <ChefHat size={15} /> Rekap Dapur
                  </button>
                  <button
                    onClick={() => handleTriggerPrint("pesanan")}
                    className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#404040] hover:bg-[#F5F5F5] hover:text-[#171717] flex items-center gap-2.5 transition-colors border-t border-[#E5E5E5]/40"
                  >
                    <Table size={15} /> Rekap Pesanan
                  </button>
                  <button
                    onClick={() => handleTriggerPrint("kupon")}
                    className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#404040] hover:bg-[#F5F5F5] hover:text-[#171717] flex items-center gap-2.5 transition-colors border-t border-[#E5E5E5]/40"
                  >
                    <Package size={15} /> Kupon Packing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white border border-[#E5E5E5]/40 p-5 sm:p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#171717]/10 text-[#171717]"><Wallet size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#404040]/50 mb-1">Total Omzet</p>
              <h3 className="text-xl font-bold text-[#404040]">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(sessionData.totalOmzet)}</h3>
            </div>
          </div>
          <div className="bg-white border border-[#E5E5E5]/40 p-5 sm:p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600"><Users size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#404040]/50 mb-1">Total Penumpang</p>
              <h3 className="text-xl font-bold text-[#404040]">{sessionData.tour_orders.length} Orang</h3>
            </div>
          </div>
          <div className="bg-white border border-[#E5E5E5]/40 p-5 sm:p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100 text-orange-600"><Package size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#404040]/50 mb-1">Barang Disiapkan</p>
              <h3 className="text-xl font-bold text-[#404040]">{sessionData.totalItems} Pcs</h3>
            </div>
          </div>
        </div>

        {/* Navigasi 3 Sub-Tab */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-[#E5E5E5] pb-4">
          <button
            onClick={() => setActiveTab("dapur")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === "dapur" ? "bg-[#171717] text-white shadow-sm" : "bg-white text-[#404040]/60 border border-[#E5E5E5] hover:text-[#171717]"
            }`}
          >
            <ChefHat size={15} /> REKAP DAPUR
          </button>
          <button
            onClick={() => setActiveTab("matriks")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === "matriks" ? "bg-[#171717] text-white shadow-sm" : "bg-white text-[#404040]/60 border border-[#E5E5E5] hover:text-[#171717]"
            }`}
          >
            <Table size={15} /> REKAP PESANAN
          </button>
          <button
            onClick={() => setActiveTab("detail")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === "detail" ? "bg-[#171717] text-white shadow-sm" : "bg-white text-[#404040]/60 border border-[#E5E5E5] hover:text-[#171717]"
            }`}
          >
            <UserCheck size={15} /> KUPON PACKING
          </button>
        </div>

        {/* Konten Sub-Tab 1: Rekap Dapur */}
        {activeTab === "dapur" && (
          <div className="bg-white border border-[#E5E5E5]/60 rounded-2xl p-6 shadow-sm max-w-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-[#E5E5E5]/40 pb-4">
              <ChefHat size={20} className="text-[#171717]" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#404040]">Total Barang Disiapkan Dapur</h2>
            </div>
            
            {sessionData.aggregatedItems.length === 0 ? (
              <p className="text-center text-sm text-[#404040]/40 italic py-10">Belum ada pesanan masuk.</p>
            ) : (
              <ul className="space-y-3">
                {sessionData.aggregatedItems.map((item: any, idx: number) => (
                  <li key={idx} className="flex justify-between items-center text-sm border-b border-[#E5E5E5]/30 pb-2.5 last:border-0">
                    <span className="font-semibold text-[#404040]">{item.name}</span>
                    <span className="font-bold text-[#FAFAFA] bg-[#171717] px-3.5 py-1 rounded-md text-xs">{item.qty} Pcs</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        
                {/* Konten Sub-Tab 2: Rekap Pesanan */}
        {activeTab === "matriks" && (
          <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm overflow-hidden dark:border-neutral-800 dark:bg-neutral-950">
            {sessionData.tour_orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-900">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="mt-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Belum ada pesanan masuk
                </p>
              </div>
            ) : (
              <div>
                {/* Header Ringkas */}
                <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 bg-neutral-50/50 dark:border-neutral-800/80 dark:bg-neutral-900/40">
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                      Matriks Pesanan
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Rincian kuantitas menu per penumpang
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {sessionData.tour_orders.length} Penumpang
                  </span>
                </div>

                {/* Tabel Fit Lebar Layar */}
                <div className="w-full">
                  <table className="w-full table-fixed text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50/90 dark:border-neutral-800 dark:bg-neutral-900/60">
                        <th scope="col" className="w-8 px-1.5 py-2.5 text-center font-semibold text-neutral-400">
                          #
                        </th>
                        <th scope="col" className="w-[30%] sm:w-[25%] px-2.5 py-2.5 font-semibold text-neutral-700 dark:text-neutral-300">
                          Nama
                        </th>
                        {sessionData.productColumns.map((colName: string) => (
                          <th
                            key={colName}
                            scope="col"
                            className="px-1 py-2.5 text-center font-medium text-neutral-700 dark:text-neutral-300"
                          >
                            <span className="block text-[11px] leading-tight break-words font-semibold">
                              {colName}
                            </span>
                          </th>
                        ))}
                        <th
                          scope="col"
                          className="w-[20%] sm:w-[18%] px-2.5 py-2.5 text-right font-semibold text-neutral-900 dark:text-neutral-100"
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                      {sessionData.tour_orders.map((order: any, idx: number) => (
                        <tr
                          key={order.id}
                          className="transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-900/30"
                        >
                          <td className="px-1.5 py-2 text-center font-mono text-[11px] text-neutral-400 align-top">
                            {idx + 1}
                          </td>
                          {/* Nama Penumpang: otomatis wrap ke bawah jika panjang */}
                          <td className="px-2.5 py-2 align-top">
                            <span className="block break-words font-medium text-neutral-900 leading-snug dark:text-neutral-100">
                              {order.passenger_name}
                            </span>
                          </td>
                          {sessionData.productColumns.map((colName: string) => {
                            const qty = order.itemMap?.[colName];
                            return (
                              <td
                                key={colName}
                                className="px-1 py-2 text-center align-top tabular-nums"
                              >
                                {qty ? (
                                  <span className="inline-flex min-w-[20px] items-center justify-center rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-bold text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
                                    {qty}
                                  </span>
                                ) : (
                                  <span className="text-neutral-300 dark:text-neutral-700">
                                    -
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          {/* Total Bayar Ringkas */}
                          <td className="px-2.5 py-2 text-right align-top font-semibold tabular-nums text-neutral-900 dark:text-neutral-100 leading-snug">
                            <span className="block break-words text-[11px] sm:text-xs">
                              Rp {order.orderTotal.toLocaleString("id-ID")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Ringkasan Bawah */}
                    <tfoot>
                      <tr className="border-t-2 border-neutral-200 bg-neutral-50/80 font-semibold dark:border-neutral-800 dark:bg-neutral-900/80">
                        <td
                          colSpan={2}
                          className="px-2.5 py-2.5 text-[11px] uppercase tracking-wider text-neutral-500"
                        >
                          Total
                        </td>
                        {sessionData.productColumns.map((colName: string) => {
                          const totalQty = sessionData.tour_orders.reduce(
                            (acc: number, order: any) =>
                              acc + (order.itemMap?.[colName] || 0),
                            0
                          );
                          return (
                            <td
                              key={colName}
                              className="px-1 py-2.5 text-center font-mono text-[11px] tabular-nums text-neutral-900 dark:text-neutral-100"
                            >
                              {totalQty > 0 ? (
                                <span className="font-bold">{totalQty}</span>
                              ) : (
                                <span className="text-neutral-300 dark:text-neutral-700">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2.5 py-2.5 text-right font-bold tabular-nums text-[11px] sm:text-xs text-neutral-950 dark:text-white leading-snug">
                          Rp{" "}
                          {sessionData.tour_orders
                            .reduce(
                              (acc: number, order: any) =>
                                acc + (order.orderTotal || 0),
                              0
                            )
                            .toLocaleString("id-ID")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Konten Sub-Tab 3: Detail Per Orang */}
        {activeTab === "detail" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessionData.tour_orders.map((order: any) => (
                <div key={order.id} className="bg-white border border-[#E5E5E5]/60 rounded-xl p-5 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-3 border-b border-[#E5E5E5]/20 pb-3">
                    <h5 className="font-bold text-sm text-[#171717] pr-2">{order.passenger_name}</h5>
                    <div className="flex gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        Bus {order.bus_number || "1"}
                      </span>
                      <span className="text-[10px] font-bold bg-[#E5E5E5]/40 text-[#404040] px-2 py-0.5 rounded">
                        Kursi {order.seat_number || "-"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-[80px]">
                    {order.cleanItems.length === 0 ? (
                      <p className="text-xs text-[#404040]/40 italic mt-2">Tidak ada pesanan aktif.</p>
                    ) : (
                      <ul className="space-y-2">
                        {order.cleanItems.map((item: any, i: number) => (
                          <li key={i} className="flex justify-between items-start text-xs border-b border-dashed border-[#E5E5E5]/30 pb-1.5 last:border-0">
                            <span className="text-[#404040]/80 line-clamp-1 pr-2">{item.name}</span>
                            <span className="font-bold text-[#404040]">x{item.qty}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E5E5E5]/40 flex justify-between items-center bg-[#FAFAFA] -mx-5 -mb-5 p-4 rounded-b-xl">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#404040]/50">Total Tagihan</span>
                    <span className="text-sm font-bold text-[#171717]">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.orderTotal)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================== AREA KHUSUS CETAK / PRINT (HANYA MUNCUL DI KERTAS) ==================== */}
      <div className="hidden print:block bg-white text-black w-full">
        
        {/* MODE PRINT 1: REKAP DAPUR */}
        {printMode === "dapur" && (
          <div>
            <h1 className="text-xl font-bold uppercase mb-1">Rekap Dapur - {sessionData.group_name}</h1>
            <p className="text-xs mb-4">TL: {sessionData.tour_leaders?.name} | Total Barang: {sessionData.totalItems} Pcs</p>
            <table className="w-full max-w-md border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-left">No</th>
                  <th className="border border-black p-2 text-left">Nama Produk</th>
                  <th className="border border-black p-2 text-center">Total Qty (Pcs)</th>
                </tr>
              </thead>
              <tbody>
                {sessionData.aggregatedItems.map((item: any, idx: number) => (
                  <tr key={idx} className="break-inside-avoid">
                    <td className="border border-black p-2 w-10 text-center">{idx + 1}</td>
                    <td className="border border-black p-2 font-semibold">{item.name}</td>
                    <td className="border border-black p-2 text-center font-bold">{item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE PRINT 2: REKAP PESANAN (TABEL MATRIKS) */}
        {printMode === "pesanan" && (
          <div>
            <h1 className="text-lg font-bold uppercase mb-1">Rekap Pesanan - {sessionData.group_name}</h1>
            <p className="text-xs mb-3">TL: {sessionData.tour_leaders?.name} | Total Omzet: Rp {sessionData.totalOmzet.toLocaleString('id-ID')}</p>
            <table className="w-full border-collapse border border-black text-[11px]">
              <thead>
                <tr className="bg-[#FFFF00] font-bold">
                  <th className="border border-black p-1.5 text-center">No</th>
                  <th className="border border-black p-1.5 text-left">Nama</th>
                  {sessionData.productColumns.map((colName: string) => (
                    <th key={colName} className="border border-black p-1.5 text-center">{colName}</th>
                  ))}
                  <th className="border border-black p-1.5 text-right text-red-600">Harga</th>
                </tr>
              </thead>
              <tbody>
                {sessionData.tour_orders.map((order: any, idx: number) => (
                  <tr key={order.id} className="break-inside-avoid">
                    <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-black p-1.5 font-medium">{order.passenger_name}</td>
                    {sessionData.productColumns.map((colName: string) => (
                      <td key={colName} className="border border-black p-1.5 text-center font-bold">
                        {order.itemMap?.[colName] || ""}
                      </td>
                    ))}
                    <td className="border border-black p-1.5 text-right font-bold text-red-600">
                      {order.orderTotal.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE PRINT 3: KUPON PACKING (PER BARIS RATA TINGGI & MUDAH DIGUNTING LURUS) */}
        {printMode === "kupon" && (
          <div className="w-full space-y-4">
            {couponRows.map((rowChunk, rowIndex) => {
              // Cari jumlah item terbanyak di dalam baris (3 orang) ini agar tinggi tabel rata
              const maxItemsInRow = Math.max(...rowChunk.map((o: any) => o.cleanItems.length), 1);

              return (
                <div key={rowIndex} className="coupon-row grid grid-cols-3 gap-3 items-stretch">
                  {rowChunk.map((order: any) => {
                    const emptyRowsCount = maxItemsInRow - order.cleanItems.length;

                    return (
                      <div key={order.id} className="border-2 border-black text-[11px] flex flex-col justify-between bg-white">
                        <table className="w-full border-collapse flex-1">
                          <tbody>
                            {/* Baris 1: Nama Rombongan */}
                            <tr>
                              <td colSpan={2} className="border border-black p-1 font-bold text-center align-middle w-1/2 leading-tight">
                                Nama Rombongan
                              </td>
                              <td colSpan={2} className="border border-black p-1 font-bold text-left w-1/2 leading-tight">
                                {sessionData.group_name}
                              </td>
                            </tr>
                            {/* Baris 2: No Bus & No Kursi */}
                            <tr>
                              <td className="border border-black p-1 font-bold text-blue-600 w-1/4 leading-tight">No Bus</td>
                              <td className="border border-black p-1 font-bold text-blue-600 text-right w-1/4 leading-tight">
                                {order.bus_number || "1"}
                              </td>
                              <td className="border border-black p-1 font-bold text-red-700 w-1/4 leading-tight">no Kursi</td>
                              <td className="border border-black p-1 font-bold text-red-700 text-right w-1/4 leading-tight">
                                {order.seat_number || "-"}
                              </td>
                            </tr>
                            {/* Baris 3: Nama Penumpang */}
                            <tr>
                              <td colSpan={2} className="border border-black p-1 text-center leading-tight">
                                nama Penumpang
                              </td>
                              <td colSpan={2} className="border border-black p-1 font-bold text-center uppercase leading-tight">
                                {order.passenger_name}
                              </td>
                            </tr>
                            {/* Baris Dinamis: Produk yang Dipesan */}
                            {order.cleanItems.map((item: any, idx: number) => (
                              <tr key={idx}>
                                <td colSpan={2} className="border border-black p-1 text-left leading-tight">
                                  {item.name}
                                </td>
                                <td colSpan={2} className="border border-black p-1 font-bold text-center leading-tight">
                                  {item.qty}
                                </td>
                              </tr>
                            ))}
                            {/* Baris Penyeimbang (Filler) agar posisi TOTAL sejajar lurus di bawah */}
                            {Array.from({ length: emptyRowsCount }).map((_, emptyIdx) => (
                              <tr key={`empty-${emptyIdx}`}>
                                <td colSpan={2} className="border border-black p-1 leading-tight">&nbsp;</td>
                                <td colSpan={2} className="border border-black p-1 leading-tight">&nbsp;</td>
                              </tr>
                            ))}
                            {/* Baris Penutup: TOTAL */}
                            <tr>
                              <td colSpan={2} className="border border-black p-1.5 font-bold text-center text-red-600 uppercase leading-tight">
                                TOTAL
                              </td>
                              <td colSpan={2} className="border border-black p-1.5 font-bold text-center text-red-600 leading-tight">
                                Rp {order.orderTotal.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}