"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Playfair_Display } from "next/font/google";
import { Edit2, Plus, Trash2, X as CloseIcon, UploadCloud, XCircle } from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"] });

const STATUSES = ["Coming Soon", "Active", "Completed"];

export default function ProgramPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    status: STATUSES[0],
    image_urls: [] as string[]
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) setPrograms(data);
    } catch (error) {
      console.error("Gagal menarik data program:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus program ini? Semua gambar di dalamnya akan musnah.")) return;
    
    const programToDelete = programs.find(p => p.id === id);
    setPrograms(programs.filter(p => p.id !== id));
    
    // Parse dan hapus semua file dari storage berdasarkan URL
    if (programToDelete?.image_urls && programToDelete.image_urls.length > 0) {
      try {
        const pathsToRemove = programToDelete.image_urls.map((url: string) => {
          const parts = new URL(url).pathname.split('/');
          // Ambil "folderName/fileName.jpg"
          return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
        });
        await supabase.storage.from('Program').remove(pathsToRemove);
      } catch (err) {
        console.error("Gagal hapus file dari bucket:", err);
      }
    }

    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (error) fetchPrograms();
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ title: "", description: "", requirements: "", status: STATUSES[0], image_urls: [] });
    setFiles([]);
    setIsModalOpen(true);
  };

  const openEditModal = (program: any) => {
    setEditingId(program.id);
    setFormData({
      title: program.title,
      description: program.description || "",
      requirements: program.requirements || "",
      status: program.status,
      image_urls: program.image_urls || []
    });
    setFiles([]);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeExistingImage = (indexToRemove: number) => {
    setFormData({
      ...formData,
      image_urls: formData.image_urls.filter((_, idx) => idx !== indexToRemove)
    });
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && files.length === 0) {
      alert("Pilih minimal satu gambar program bro!");
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrls = [...formData.image_urls];

      if (files.length > 0) {
        // Tentukan nama folder (pakai timestamp + slug)
        const folderName = `prog-${Date.now()}`;
        
        const uploadPromises = files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${folderName}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('Program')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('Program').getPublicUrl(filePath);
          return data.publicUrl;
        });

        const newUploadedUrls = await Promise.all(uploadPromises);
        // append gambar baru ke gambar yang lama
        finalImageUrls = [...finalImageUrls, ...newUploadedUrls];
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        status: formData.status,
        image_urls: finalImageUrls,
      };

      if (editingId) {
        await supabase.from('programs').update(payload).eq('id', editingId);
      } else {
        await supabase.from('programs').insert([payload]);
      }

      setIsModalOpen(false);
      fetchPrograms();
    } catch (error) {
      console.error("Proses simpan gagal:", error);
      alert("Gagal menyimpan program. Cek koneksi atau ukuran file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className={`${playfair.className} text-3xl font-bold text-[#4A0E17] mb-2`}>Program Management</h1>
          <p className="text-[#2B1B17]/60">Kelola kelas interaktif, detail persyaratan, dan multi-galeri.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-[#4A0E17] text-[#FDFBF7] px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#2B1B17] transition-colors shadow-md">
          <Plus size={18} /> Tambah Program
        </button>
      </div>

      <div className="bg-white border border-[#E5D3B3]/40 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F5F0E6] text-[#2B1B17] text-xs uppercase tracking-widest border-b border-[#E5D3B3]/40">
                <th className="p-5 font-bold w-1/2">Detail Program</th>
                <th className="p-5 font-bold">Status</th>
                <th className="p-5 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D3B3]/20">
              {isLoading ? (
                <tr><td colSpan={3} className="p-10 text-center text-[#2B1B17]/50 font-medium">Memuat program...</td></tr>
              ) : programs.length === 0 ? (
                <tr><td colSpan={3} className="p-10 text-center text-[#2B1B17]/50 font-medium">Belum ada program.</td></tr>
              ) : (
                programs.map((prog) => {
                  const images = prog.image_urls || [];
                  return (
                    <tr key={prog.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-14 rounded-lg bg-[#E5D3B3]/20 overflow-hidden relative shrink-0 border border-[#E5D3B3]/40">
                            {images.length > 0 ? (
                              <>
                                <img src={images[0]} alt={prog.title} className="w-full h-full object-cover" />
                                {images.length > 1 && (
                                  <div className="absolute inset-0 bg-[#2B1B17]/60 flex items-center justify-center text-white text-xs font-bold">
                                    +{images.length - 1}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full bg-[#E5D3B3]/50 flex items-center justify-center text-[#2B1B17]/30"><UploadCloud size={16} /></div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#2B1B17] mb-1">{prog.title}</p>
                            <p className="text-xs text-[#2B1B17]/70 line-clamp-2">{prog.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          prog.status === 'Active' ? 'bg-[#00AA5B]/10 text-[#00AA5B]' : 'bg-[#E5D3B3]/30 text-[#4A0E17]'
                        }`}>
                          {prog.status}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEditModal(prog)} className="text-[#2B1B17]/40 hover:text-[#4A0E17] p-2 transition-colors rounded-lg hover:bg-[#4A0E17]/5">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(prog.id)} className="text-[#2B1B17]/40 hover:text-red-600 p-2 transition-colors rounded-lg hover:bg-red-50">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B17]/60 backdrop-blur-sm px-4 py-8">
          <div className="bg-[#FDFBF7] w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-6 border-b border-[#E5D3B3]/40 bg-white shrink-0">
              <h2 className={`${playfair.className} text-2xl font-bold text-[#4A0E17]`}>
                {editingId ? "Edit Program" : "Tambah Program Baru"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#2B1B17]/60 hover:text-[#4A0E17] transition-colors p-2 bg-[#E5D3B3]/10 rounded-full">
                <CloseIcon size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="programForm" onSubmit={handleSaveProgram} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Nama Program</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Deskripsi Singkat</label>
                  <textarea rows={2} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm resize-none" placeholder="Deskripsi intro untuk halaman utama..." />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Persyaratan & Detail (Teks Panjang)</label>
                  <textarea rows={4} value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm resize-none" placeholder="Tulis rincian fasilitas, syarat peserta, jadwal, dll..." />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Galeri Gambar Program</label>
                  
                  {/* Tampilan Gambar Tersimpan (Saat Mode Edit) */}
                  {formData.image_urls.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      {formData.image_urls.map((url, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#E5D3B3]/50">
                          <img src={url} alt={`Saved ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeExistingImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:scale-110 transition-transform"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dropzone Multiple Upload */}
                  <div className="border-2 border-dashed border-[#E5D3B3] rounded-xl p-6 flex flex-col items-center justify-center bg-[#FDFBF7] hover:bg-[#F5F0E6] transition-colors cursor-pointer relative overflow-hidden min-h-[140px]">
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <UploadCloud size={32} className="text-[#4A0E17] mb-2" />
                      {files.length > 0 ? (
                        <div className="text-sm font-bold text-[#2B1B17]">
                          <span className="bg-[#4A0E17]/10 text-[#4A0E17] px-3 py-1 rounded-full inline-block mb-1">
                            {files.length} file dipilih siap diunggah
                          </span>
                          <div className="text-xs font-medium text-[#2B1B17]/60 mt-1 max-w-xs truncate">
                            {files.map(f => f.name).join(', ')}
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-[#2B1B17]">Pilih beberapa file sekaligus</p>
                          <p className="text-xs font-medium text-[#2B1B17]/60 mt-1">Maks 2MB per file (JPG/PNG)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-[#E5D3B3]/40 bg-white flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} type="button" className="px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest text-[#2B1B17] hover:bg-[#E5D3B3]/20 transition-colors">Batal</button>
              <button form="programForm" type="submit" disabled={isUploading} className="flex items-center gap-2 bg-[#4A0E17] text-[#FDFBF7] px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#2B1B17] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isUploading ? "Mengunggah..." : "Simpan Program"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}