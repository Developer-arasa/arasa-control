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

    // Cek username bentrok
    const { data: existingUser } = await supabase
      .from("tour_leaders")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUser) {
      return { success: false, error: "Username sudah dipakai, pilih yang lain." };
    }

    // Hash PIN sebelum masuk DB
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin, salt);

    const { error } = await supabase
      .from("tour_leaders")
      .insert([
        {
          name,
          username,
          pin_hash: pinHash,
          phone,
          agency_name: agencyName,
          is_active: 1,
        }
      ]);

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error("Gagal mendaftar TL:", error);
    return { success: false, error: "Terjadi kesalahan sistem saat menyimpan data." };
  }
}

export async function toggleStatusTL(id: string, currentStatus: number) {
  try {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const { error } = await supabase
      .from("tour_leaders")
      .update({ is_active: newStatus })
      .eq("id", id);

    if (error) throw error;
    return { success: true, newStatus };
  } catch (error) {
    console.error("Gagal update status TL:", error);
    return { success: false, error: "Gagal merubah status TL." };
  }
}