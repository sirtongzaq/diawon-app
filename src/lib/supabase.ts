import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// รองรับทั้งชื่อเดิม (anon) และคีย์แบบใหม่ (sb_publishable_...) — เป็นคีย์สาธารณะ ใส่ในเบราว์เซอร์ได้
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * client ฝั่งเบราว์เซอร์ ใช้เฉพาะ Realtime Broadcast (รับแจ้งเตือนสลิป)
 * ตารางทุกตัวเปิด RLS แบบไม่มี policy จึงอ่านข้อมูลด้วยคีย์นี้ไม่ได้
 * คืน null ถ้ายังไม่ได้ตั้งค่า env (แอปยังใช้ได้ โดยพึ่ง polling แทน)
 */
export const supabase =
  url && publicKey
    ? createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
