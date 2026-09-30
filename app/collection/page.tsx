"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Playfair_Display } from "next/font/google";
import { Check, X, Edit2, Plus, Trash2, X as CloseIcon, UploadCloud, Search, ArrowUpDown } from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"] });

const CATEGORIES = ["Onde-Onde", "Pastry & Cookies", "Cakes & Lapis", "Savory Snack"];

export default function CollectionPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    category: CATEGORIES[0],
    price: "",
    description: "",
    image_url: ""
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) setProducts(data);
    } catch (error) {
      console.error("Gagal menarik data produk:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (id: string, field: 'is_new' | 'is_best_product', currentValue: number) => {
    const newValue = currentValue === 1 ? 0 : 1;
    setProducts(products.map(p => p.id === id ? { ...p, [field]: newValue } : p));
    const { error } = await supabase.from('products').update({ [field]: newValue }).eq('id', id);
    if (error) fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus produk ini? Gambar juga akan terhapus dari sistem.")) return;
    
    const productToDelete = products.find(p => p.id === id);
    setProducts(products.filter(p => p.id !== id));
    
    if (productToDelete?.image_url) {
      try {
        const oldFileName = productToDelete.image_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage.from('product-images').remove([oldFileName]);
        }
      } catch (err) {
        console.error("Gagal hapus gambar lama dari storage:", err);
      }
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert("Gagal menghapus produk");
      fetchProducts();
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", category: CATEGORIES[0], price: "", description: "", image_url: "" });
    setFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      description: product.description || "",
      image_url: product.image_url
    });
    setFile(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && !file) {
      alert("Pilih gambar produk dulu bro!");
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = formData.image_url;

      if (file) {
        if (editingId && formData.image_url) {
          try {
            const oldFileName = formData.image_url.split('/').pop();
            if (oldFileName) {
              await supabase.storage.from('product-images').remove([oldFileName]);
            }
          } catch (err) {
            console.error("Gagal hapus gambar lama (lanjut upload baru):", err);
          }
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        finalImageUrl = publicUrlData.publicUrl;
      }

      const productPayload = {
        name: formData.name,
        category: formData.category,
        price: parseInt(formData.price),
        description: formData.description,
        image_url: finalImageUrl,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert([{ ...productPayload, is_new: 1, is_best_product: 0 }]);
        if (insertError) throw insertError;
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Proses simpan gagal:", error);
      alert("Gagal menyimpan produk. Coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedProducts = [...products]
    .filter(product => product.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className={`${playfair.className} text-3xl font-bold text-[#4A0E17] mb-2`}>The Collection</h1>
          <p className="text-[#2B1B17]/60">Kelola katalog produk, status rilis, dan otomatisasi upload.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#4A0E17] text-[#FDFBF7] px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#2B1B17] transition-colors shadow-md"
        >
          <Plus size={18} /> Tambah Produk
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <input 
            type="text" 
            placeholder="Cari nama produk..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] text-sm shadow-sm"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2B1B17]/40" />
        </div>
      </div>

      <div className="bg-white border border-[#E5D3B3]/40 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F5F0E6] text-[#2B1B17] text-xs uppercase tracking-widest border-b border-[#E5D3B3]/40">
                <th className="p-5 font-bold cursor-pointer hover:bg-[#E5D3B3]/20 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">Produk <ArrowUpDown size={14} className="text-[#2B1B17]/40" /></div>
                </th>
                <th className="p-5 font-bold cursor-pointer hover:bg-[#E5D3B3]/20 transition-colors" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-2">Kategori <ArrowUpDown size={14} className="text-[#2B1B17]/40" /></div>
                </th>
                <th className="p-5 font-bold text-center cursor-pointer hover:bg-[#E5D3B3]/20 transition-colors" onClick={() => handleSort('is_new')}>
                  <div className="flex items-center justify-center gap-2">New Release <ArrowUpDown size={14} className="text-[#2B1B17]/40" /></div>
                </th>
                <th className="p-5 font-bold text-center cursor-pointer hover:bg-[#E5D3B3]/20 transition-colors" onClick={() => handleSort('is_best_product')}>
                  <div className="flex items-center justify-center gap-2">Best Choice <ArrowUpDown size={14} className="text-[#2B1B17]/40" /></div>
                </th>
                <th className="p-5 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D3B3]/20">
              {isLoading ? (
                <tr><td colSpan={5} className="p-10 text-center text-[#2B1B17]/50 font-medium">Memuat katalog...</td></tr>
              ) : processedProducts.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-[#2B1B17]/50 font-medium">Tidak ada produk ditemukan.</td></tr>
              ) : (
                processedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#E5D3B3]/20 overflow-hidden relative shrink-0 border border-[#E5D3B3]/40">
                          {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-bold text-[#2B1B17] mb-1">{product.name}</p>
                          <p className="text-xs text-[#4A0E17] font-semibold">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.price)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-sm text-[#2B1B17]/80 font-medium">{product.category}</td>
                    <td className="p-5 text-center">
                      <button onClick={() => toggleStatus(product.id, 'is_new', product.is_new)} className={`inline-flex p-2 rounded-full transition-all ${product.is_new === 1 ? 'bg-[#00AA5B]/10 text-[#00AA5B] shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        {product.is_new === 1 ? <Check size={18} /> : <X size={18} />}
                      </button>
                    </td>
                    <td className="p-5 text-center">
                      <button onClick={() => toggleStatus(product.id, 'is_best_product', product.is_best_product)} className={`inline-flex p-2 rounded-full transition-all ${product.is_best_product === 1 ? 'bg-[#4A0E17]/10 text-[#4A0E17] shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        {product.is_best_product === 1 ? <Check size={18} /> : <X size={18} />}
                      </button>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditModal(product)} className="text-[#2B1B17]/40 hover:text-[#4A0E17] p-2 transition-colors rounded-lg hover:bg-[#4A0E17]/5">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="text-[#2B1B17]/40 hover:text-red-600 p-2 transition-colors rounded-lg hover:bg-red-50">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B17]/60 backdrop-blur-sm px-4">
          <div className="bg-[#FDFBF7] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-[#E5D3B3]/40 bg-white">
              <h2 className={`${playfair.className} text-2xl font-bold text-[#4A0E17]`}>
                {editingId ? "Edit Produk" : "Tambah Produk Baru"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#2B1B17]/60 hover:text-[#4A0E17] transition-colors p-2 bg-[#E5D3B3]/10 rounded-full">
                <CloseIcon size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="productForm" onSubmit={handleSaveProduct} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Nama Produk</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Harga (Rp)</label>
                    <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Kategori</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Deskripsi</label>
                  <textarea rows={3} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-[#E5D3B3] rounded-xl outline-none focus:border-[#4A0E17] bg-white text-sm resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#2B1B17]/70 mb-2">Gambar Produk</label>
                  <div className="border-2 border-dashed border-[#E5D3B3] rounded-xl p-6 flex flex-col items-center justify-center bg-[#FDFBF7] hover:bg-[#F5F0E6] transition-colors cursor-pointer relative overflow-hidden h-40">
                    <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    
                    {file ? (
                      <img src={URL.createObjectURL(file)} alt="Preview Baru" className="absolute inset-0 w-full h-full object-cover opacity-60 z-0" />
                    ) : formData.image_url ? (
                      <img src={formData.image_url} alt="Preview Lama" className="absolute inset-0 w-full h-full object-cover opacity-30 z-0 grayscale" />
                    ) : null}

                    <div className="relative z-10 flex flex-col items-center">
                      <UploadCloud size={32} className="text-[#4A0E17] mb-2 drop-shadow-md" />
                      <p className="text-sm font-bold text-[#2B1B17] text-center drop-shadow-sm bg-white/60 px-3 py-1 rounded-full backdrop-blur-sm">
                        {file ? file.name : editingId ? "Timpa dengan gambar baru" : "Klik atau seret gambar"}
                      </p>
                      <p className="text-xs font-medium text-[#2B1B17]/70 mt-2 bg-white/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        Maks 2MB (JPG/PNG)
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-[#E5D3B3]/40 bg-white flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} type="button" className="px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest text-[#2B1B17] hover:bg-[#E5D3B3]/20 transition-colors">
                Batal
              </button>
              <button form="productForm" type="submit" disabled={isUploading} className="flex items-center gap-2 bg-[#4A0E17] text-[#FDFBF7] px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#2B1B17] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isUploading ? "Memproses..." : "Simpan Produk"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}