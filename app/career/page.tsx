"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Playfair_Display } from "next/font/google";
import { Check, X, Edit2, Plus, Trash2, X as CloseIcon } from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"] });

export default function CareerPage() {
  const [careers, setCareers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    placement: "",
    type: "Full-Time",
    qualifications: "",
    benefits: ""
  });

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('careers')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) setCareers(data);
    } catch (error) {
      console.error("Gagal menarik data karir:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentValue: number) => {
    const newValue = currentValue === 1 ? 0 : 1;
    setCareers(careers.map(c => c.id === id ? { ...c, is_active: newValue } : c));
    const { error } = await supabase.from('careers').update({ is_active: newValue }).eq('id', id);
    if (error) fetchCareers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus lowongan ini?")) return;
    setCareers(careers.filter(c => c.id !== id));
    const { error } = await supabase.from('careers').delete().eq('id', id);
    if (error) fetchCareers();
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ title: "", placement: "", type: "Full-Time", qualifications: "", benefits: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (career: any) => {
    setEditingId(career.id);
    setFormData({
      title: career.title,
      placement: career.placement,
      type: career.type,
      // Convert array JSONB ke teks per baris untuk textarea
      qualifications: Array.isArray(career.qualifications) ? career.qualifications.join("\n") : "",
      benefits: Array.isArray(career.benefits) ? career.benefits.join("\n") : ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Pecah teks berdasarkan enter dan filter baris kosong
      const qualificationsArray = formData.qualifications.split('\n').map(q => q.trim()).filter(q => q !== "");
      const benefitsArray = formData.benefits.split('\n').map(b => b.trim()).filter(b => b !== "");

      const payload = {
        title: formData.title,
        placement: formData.placement,
        type: formData.type,
        qualifications: qualificationsArray,
        benefits: benefitsArray,
      };

      if (editingId) {
        await supabase.from('careers').update(payload).eq('id', editingId);
      } else {
        await supabase.from('careers').insert([{ ...payload, is_active: 1 }]);
      }

      setIsModalOpen(false);
      fetchCareers();
    } catch (error) {
      console.error("Gagal simpan:", error);
      alert("Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className={`${playfair.className} text-3xl font-bold text-[#4A0E17] mb-2`}>Career Management</h1>
          <p className="text-[#2B1B17]/60">Kelola informasi lowongan kerja aktif.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-[#4A0E17] text-[#FDFBF7] px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#2B1B17] transition-colors shadow-md">
          <Plus size={18} /> Tambah Lowongan
        </button>
      </div>

      <div className="bg-white border border-[#E5D3B3]/40 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F5F0E6] text-[#2B1B17] text-xs uppercase tracking-widest border-b border-[#E5D3B3]/40">
                <th className="p-5 font-bold">Posisi & Tipe</th>
                <th className="p-5 font-bold">Penempatan</th>
                <th className="p-5 font-bold text-center">Status Aktif</th>
                <th className="p-5 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D3B3]/20">
              {isLoading ? (
                <tr><td colSpan={4} className="p-10 text-center text-[#2B1B17]/50 font-medium">Memuat data...</td></tr>
              ) : careers.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-[#2B1B17]/50 font-medium">Belum ada lowongan.</td></tr>
              ) : (
                careers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-[#2B1B17] mb-1">{c.title}</p>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#4A0E17]">{c.type}</p>
                    </td>
                    <td className="p-5 text-sm text-[#2B1B17]/80">{c.placement}</td>
                    <td className="p-5 text-center">
                      <button onClick={() => toggleStatus(c.id, c.is_active)} className={`inline-flex p-2 rounded-full transition-all ${c.is_active === 1 ? 'bg-[#00AA5B]/10 text-[#00AA5B] shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        {c.is_active === 1 ? <Check size={18} /> : <X size={18} />}
                      </button>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditModal(c)} className="text-[#2B1B17]/40 hover:text-[#4A0E17] p-2 transition-colors rounded-lg hover:bg-[#4A0E17]/5">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="text-[#2B1B17]/40 hover:text-red-600 p-2 transition-colors rounded-lg hover:bg-red-50">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B17]/60 backdrop-blur-sm px-4 py-8">
          <div className="bg-[#FDFBF7] w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-6 border-b border-[#E5D3B3]/40 bg-white shrink-0">
              <h2 className={`${playfair.className} text-2xl font-bold text-[#4A0E17]`}>
                {editingId ? "Edit Lowongan" : "Tambah Lowongan Baru"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#2B1B17]/60 hover:text-[#4A0E17] transition-colors p-2 bg-[#E5D3B3]/10 rounded-full">
                <CloseIcon size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="careerForm" onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Posisi Pekerjaan</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm" placeholder="Contoh: Store Manager" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Tipe Pekerjaan</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm">
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Penempatan</label>
                  <input type="text" required value={formData.placement} onChange={e => setFormData({...formData, placement: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm" placeholder="Contoh: Arasa Pusat, Mojokerto" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Kualifikasi (Pisahkan dengan Enter)</label>
                  <textarea rows={4} required value={formData.qualifications} onChange={e => setFormData({...formData, qualifications: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm resize-none leading-relaxed" placeholder="Minimal SMA/SMK sederajat&#10;Pengalaman 1 tahun&#10;Komunikatif" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Benefit (Pisahkan dengan Enter)</label>
                  <textarea rows={4} required value={formData.benefits} onChange={e => setFormData({...formData, benefits: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm resize-none leading-relaxed" placeholder="Gaji Pokok&#10;Tunjangan Transport&#10;BPJS" />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-[#E5D3B3]/40 bg-white flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} type="button" className="px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest text-[#2B1B17] hover:bg-[#E5D3B3]/20 transition-colors">
                Batal
              </button>
              <button form="careerForm" type="submit" disabled={isSaving} className="flex items-center gap-2 bg-[#4A0E17] text-[#FDFBF7] px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#2B1B17] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? "Menyimpan..." : "Simpan Lowongan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}