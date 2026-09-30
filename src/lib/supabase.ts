import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** null ถ้ายังไม่ได้ตั้งค่า env (แอปยังใช้งานแบบไม่บันทึกได้) */
export const supabase = url && anon ? createClient(url, anon) : null;
