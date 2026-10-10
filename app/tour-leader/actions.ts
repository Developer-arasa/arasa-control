"use server";

import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function registerTourLeader(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const username = formData.get("username") as string;
    const pin = formData.get("pin") as string;
    const phone = formData.get("phone") as string;
    const agencyName = formData.get("agencyName") as string;

    if (!name || !username || !pin || pin.length !== 6) {
      return { success: false, error: "Data tidak lengkap atau PIN tidak 6 digit." };
    }

    const { data: existingUser } = await supabase.from("tour_leaders").select("id").eq("username", username).single();
    if (existingUser) {
      return { success: false, error: "Username sudah dipakai, pilih yang lain." };
    }

    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin, salt);

    const { error } = await supabase.from("tour_leaders").insert([{
        name, username, pin_hash: pinHash, phone, agency_name: agencyName, is_active: 1,
    }]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Gagal mendaftar TL:", error);
    return { success: false, error: "Terjadi kesalahan sistem saat menyimpan data." };
  }
}

export async function editTourLeader(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const agencyName = formData.get("agencyName") as string;
    const pin = formData.get("pin") as string;

    if (!name) return { success: false, error: "Nama wajib diisi." };

    const updatePayload: { name: string; phone: string; agency_name: string; pin_hash?: string } = { name, phone, agency_name: agencyName };

    if (pin && pin.length === 6) {
      const salt = await bcrypt.genSalt(10);
      updatePayload.pin_hash = await bcrypt.hash(pin, salt);
    } else if (pin && pin.length !== 6) {
      return { success: false, error: "PIN harus 6 digit jika ingin diubah." };
    }

    const { error } = await supabase.from("tour_leaders").update(updatePayload).eq("id", id);
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Gagal edit TL:", error);
    return { success: false, error: "Terjadi kesalahan sistem saat update data." };
  }
}

export async function toggleStatusTL(id: string, currentStatus: number) {
  try {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const { error } = await supabase.from("tour_leaders").update({ is_active: newStatus }).eq("id", id);
    if (error) throw error;
    return { success: true, newStatus };
  } catch (error) {
    console.error("Gagal update status TL:", error);
    return { success: false, error: "Gagal merubah status TL." };
  }
}

export async function deleteTourLeader(id: string) {
  try {
    const { error } = await supabase.from("tour_leaders").delete().eq("id", id);
    if (error) {
      await supabase.from("tour_leaders").update({ is_active: 0 }).eq("id", id);
      return { success: true, note: "Akun dinonaktifkan permanen (Soft Delete) karena memiliki riwayat rombongan." };
    }
    return { success: true };
  } catch (error) {
    console.error("Gagal hapus TL:", error);
    return { success: false, error: "Gagal menghapus TL." };
  }
}