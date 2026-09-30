import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client ฝั่งเซิร์ฟเวอร์ (service role — ข้าม RLS)
 * ใช้ใน route handler / server component เท่านั้น ห้าม import จากไฟล์ "use client"
 * คืน null ถ้ายังไม่ได้ตั้งค่า env
 */
export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
