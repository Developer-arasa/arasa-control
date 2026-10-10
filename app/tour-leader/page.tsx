"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Plus, UserCheck, UserX, Building2, Phone, Edit2, Trash2, History, X } from "lucide-react";
import { registerTourLeader, toggleStatusTL, editTourLeader, deleteTourLeader } from "./actions";


export default function TLControlPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editMode, setEditMode] = useState<{ active: boolean; data: any }>({ active: false, data: null });
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; tlName: string; sessions: any[] }>({ isOpen: false, tlName: "", sessions: [] });

  const fetchLeaders = async () => {
    try {
      const { data } = await supabase.from("tour_leaders").select("*").order("created_at", { ascending: false });
      setLeaders(data || []);
    } catch (err) {
      console.error("Error fetching TL:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaders(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    let result;
    if (editMode.active) {
      result = await editTourLeader(editMode.data.id, formData);
    } else {
      result = await registerTourLeader(formData);
    }

    if (result.success) {
      alert(editMode.active ? "Data TL diperbarui!" : "Tour Leader berhasil didaftarkan!");
      (e.target as HTMLFormElement).reset();
      setEditMode({ active: false, data: null });
      fetchLeaders();
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus TL ini?")) return;
    const result = await deleteTourLeader(id);
    if (result.success) {
      if (result.note) alert(result.note);
      fetchLeaders();
    } else {
      alert(result.error);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: number) => {
    if (!window.confirm(currentStatus === 1 ? "Nonaktifkan akun ini?" : "Aktifkan kembali akun ini?")) return;
    const result = await toggleStatusTL(id, currentStatus);
    if (result.success) fetchLeaders();
  };

  const viewHistory = async (tlId: string, tlName: string) => {
    try {
      const { data } = await supabase.from('tour_sessions').select('*').eq('tl_id', tlId).order('created_at', { ascending: false });
      setHistoryModal({ isOpen: true, tlName, sessions: data || [] });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 bg-[#FAFAFA] min-h-screen">
      <div className="mb-6 sm:mb-8 mt-4 sm:mt-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 mb-2">Manajemen Tour Leader</h1>
        <p className="text-xs sm:text-sm text-[#404040]/60 font-light">Daftarkan akun TL baru, edit data, dan pantau riwayat rombongan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#E5E5E5]/60 p-5 sm:p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#E5E5E5]/40">
              <div className="flex items-center gap-2">
                {editMode.active ? <Edit2 size={18} className="text-[#171717]" /> : <Plus size={18} className="text-[#171717]" />}
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#404040]">
                  {editMode.active ? "Edit Data TL" : "Daftar TL Baru"}
                </h2>
              </div>
              {editMode.active && (
                <button onClick={() => setEditMode({ active: false, data: null })} className="text-xs text-neutral-600 font-bold hover:underline">Batal</button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#404040]/60 mb-1.5">Nama Lengkap</label>
                <input type="text" name="name" defaultValue={editMode.data?.name || ""} required className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-white outline-none focus:border-[#171717]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#404040]/60 mb-1.5">Biro / Agen</label>
                <input type="text" name="agencyName" defaultValue={editMode.data?.agency_name || ""} className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-white outline-none focus:border-[#171717]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#404040]/60 mb-1.5">No. WhatsApp</label>
                <input type="text" name="phone" defaultValue={editMode.data?.phone || ""} className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-white outline-none focus:border-[#171717]" />
              </div>
              
              {!editMode.active && (
                <div className="pt-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#404040]/60 mb-1.5">Username (Login)</label>
                  <input type="text" name="username" required className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-white outline-none focus:border-[#171717]" />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#404040]/60 mb-1.5">PIN (6 Digit) {editMode.active && "(Opsional)"}</label>
                <input type="text" name="pin" maxLength={6} pattern="\d{6}" required={!editMode.active} className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm tracking-[0.3em] font-medium bg-white outline-none focus:border-[#171717]" placeholder={editMode.active ? "Kosongkan jika tidak diubah" : "123456"} />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full mt-4 bg-[#171717] text-[#FAFAFA] py-3.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-[#404040] transition-all disabled:opacity-50">
                {isSubmitting ? "Menyimpan..." : editMode.active ? "Simpan Perubahan" : "Daftarkan TL"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-[#E5E5E5]/60 rounded-2xl shadow-sm overflow-hidden h-full">
            <div className="flex items-center justify-between p-5 border-b border-[#E5E5E5]/40 bg-[#FAFAFA]/30">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#171717]" />
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#404040]">Daftar Agen & TL</h2>
              </div>
            </div>
            
            <div className="divide-y divide-[#E5E5E5]/30 overflow-x-auto min-w-[300px]">
              {loading ? (
                <div className="p-8 text-center text-[#404040]/40 text-sm">Memuat data...</div>
              ) : leaders.map((tl) => (
                <div key={tl.id} className="p-4 sm:p-5 hover:bg-[#FAFAFA]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-bold text-[#404040]">{tl.name}</h3>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${tl.is_active === 1 ? 'bg-[#525252]/10 text-[#525252]' : 'bg-[#171717]/10 text-[#171717]'}`}>
                        {tl.is_active === 1 ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#404040]/60 mt-1.5">
                      <span className="flex items-center gap-1.5"><Building2 size={12}/> {tl.agency_name || '-'}</span>
                      <span className="flex items-center gap-1.5"><Phone size={12}/> {tl.phone || '-'}</span>
                      <span className="font-mono bg-[#E5E5E5]/20 px-1.5 py-0.5 rounded text-[10px]">@{tl.username}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => viewHistory(tl.id, tl.name)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors shrink-0">
                      <History size={14} /> Riwayat
                    </button>
                    <button onClick={() => setEditMode({ active: true, data: tl })} className="p-2 rounded-lg text-[#404040]/40 hover:text-[#171717] hover:bg-[#171717]/10 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleToggleStatus(tl.id, tl.is_active)} className="p-2 rounded-lg text-[#404040]/40 hover:text-[#525252] hover:bg-[#525252]/10 transition-colors">
                      {tl.is_active === 1 ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                    <button onClick={() => handleDelete(tl.id)} className="p-2 rounded-lg text-[#404040]/40 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {historyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#404040]/60 backdrop-blur-sm px-4">
          <div className="bg-[#FAFAFA] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-[#E5E5E5]/40 bg-white">
              <h2 className="text-lg font-bold text-neutral-950 truncate pr-4">Riwayat: {historyModal.tlName}</h2>
              <button onClick={() => setHistoryModal({ isOpen: false, tlName: "", sessions: [] })} className="p-1.5 bg-[#E5E5E5]/10 text-[#404040]/60 hover:text-[#171717] rounded-full shrink-0 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto divide-y divide-[#E5E5E5]/30 bg-white">
              {historyModal.sessions.length === 0 ? (
                <p className="text-center text-sm text-[#404040]/50 py-10">Belum ada riwayat sesi.</p>
              ) : (
                historyModal.sessions.map(s => (
                  <div key={s.id} className="py-3.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-[#404040]">{s.group_name || "Tanpa Nama"}</p>
                      <p className="text-[10px] text-[#404040]/60 mt-0.5">{new Date(s.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${s.status === 'active' ? 'bg-[#525252]/10 text-[#525252]' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status === 'active' ? 'Berjalan' : 'Selesai'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}