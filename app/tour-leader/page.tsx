"use client";

import { useState, useEffect } from "react";
import { Playfair_Display } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { Users, Plus, UserCheck, UserX, Building2, Phone } from "lucide-react";
import { registerTourLeader, toggleStatusTL } from "./actions";

const playfair = Playfair_Display({ subsets: ["latin"] });

export default function TLControlPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeaders = async () => {
    try {
      const { data, error } = await supabase
        .from("tour_leaders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeaders(data || []);
    } catch (err) {
      console.error("Error fetching TL:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await registerTourLeader(formData);
    
    if (result.success) {
      alert("Tour Leader berhasil didaftarkan!");
      (e.target as HTMLFormElement).reset();
      fetchLeaders(); // refresh list otomatis
    } else {
      alert(result.error);
    }
    
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: number) => {
    const confirmMsg = currentStatus === 1 
      ? "Yakin ingin menonaktifkan akun ini?" 
      : "Yakin ingin mengaktifkan kembali akun ini?";
      
    if (!window.confirm(confirmMsg)) return;

    const result = await toggleStatusTL(id, currentStatus);
    if (result.success) {
      fetchLeaders();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 bg-[#FDFBF7] min-h-screen">
      <div className="mb-8">
        <h1 className={`${playfair.className} text-3xl sm:text-4xl font-bold text-[#2B1B17] mb-2`}>
          Manajemen Tour Leader
        </h1>
        <p className="text-sm text-[#2B1B17]/60 font-light">
          Daftarkan akun TL baru atau kelola akses agen B2B yang sudah ada.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Register */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#E5D3B3]/60 p-6 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#E5D3B3]/40">
              <Plus size={20} className="text-[#4A0E17]" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#2B1B17]">
                Daftar TL Baru
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2B1B17]/60 mb-1.5">Nama Lengkap</label>
                <input type="text" name="name" required className="w-full px-4 py-3 rounded-xl border border-[#E5D3B3] outline-none focus:border-[#4A0E17] text-sm bg-white" placeholder="Contoh: Aksara Putra Semesta" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2B1B17]/60 mb-1.5">Biro / Agen</label>
                <input type="text" name="agencyName" className="w-full px-4 py-3 rounded-xl border border-[#E5D3B3] outline-none focus:border-[#4A0E17] text-sm bg-white" placeholder="Contoh: Wonderfull Indonesia" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2B1B17]/60 mb-1.5">No. WhatsApp</label>
                <input type="text" name="phone" className="w-full px-4 py-3 rounded-xl border border-[#E5D3B3] outline-none focus:border-[#4A0E17] text-sm bg-white" placeholder="Contoh: 0812345678" />
              </div>

              <div className="pt-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2B1B17]/60 mb-1.5">Username (Untuk Login)</label>
                <input type="text" name="username" required className="w-full px-4 py-3 rounded-xl border border-[#E5D3B3] outline-none focus:border-[#4A0E17] text-sm bg-white" placeholder="tanpa_spasi" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2B1B17]/60 mb-1.5">PIN (6 Digit)</label>
                <input type="text" name="pin" required maxLength={6} pattern="\d{6}" className="w-full px-4 py-3 rounded-xl border border-[#E5D3B3] outline-none focus:border-[#4A0E17] text-sm bg-white tracking-[0.3em] font-medium" placeholder="123456" />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-4 bg-[#4A0E17] text-[#FDFBF7] py-3.5 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#2B1B17] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Menyimpan..." : "Daftarkan TL"}
              </button>
            </form>
          </div>
        </div>

        {/* List TL */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#E5D3B3]/60 rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#E5D3B3]/40 bg-[#FDFBF7]/30">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-[#4A0E17]" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#2B1B17]">
                  Daftar Agen & TL
                </h2>
              </div>
            </div>

            <div className="p-0">
              {loading ? (
                <div className="p-8 text-center text-[#2B1B17]/40 text-sm">Memuat data...</div>
              ) : leaders.length === 0 ? (
                <div className="p-8 text-center text-[#2B1B17]/40 text-sm">Belum ada Tour Leader yang didaftarkan.</div>
              ) : (
                <div className="divide-y divide-[#E5D3B3]/30">
                  {leaders.map((tl) => (
                    <div key={tl.id} className="p-4 sm:p-6 hover:bg-[#FDFBF7]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-sm font-bold text-[#2B1B17]">{tl.name}</h3>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            tl.is_active === 1 ? 'bg-[#00AA5B]/10 text-[#00AA5B]' : 'bg-[#4A0E17]/10 text-[#4A0E17]'
                          }`}>
                            {tl.is_active === 1 ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#2B1B17]/60 mt-2">
                          <span className="flex items-center gap-1.5"><Building2 size={12}/> {tl.agency_name || '-'}</span>
                          <span className="flex items-center gap-1.5"><Phone size={12}/> {tl.phone || '-'}</span>
                          <span className="font-mono bg-[#E5D3B3]/20 px-1.5 py-0.5 rounded text-[10px]">@{tl.username}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleToggleStatus(tl.id, tl.is_active)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                          tl.is_active === 1 
                            ? 'border border-[#4A0E17]/20 text-[#4A0E17] hover:bg-[#4A0E17]/10' 
                            : 'border border-[#00AA5B]/20 text-[#00AA5B] hover:bg-[#00AA5B]/10'
                        }`}
                      >
                        {tl.is_active === 1 ? (
                          <><UserX size={14} /> Cabut Akses</>
                        ) : (
                          <><UserCheck size={14} /> Aktifkan</>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}