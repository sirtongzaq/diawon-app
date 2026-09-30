import { NextResponse } from "next/server";
import { getBillSummaries, NotConfiguredError } from "@/lib/server/bills";

const MAX_TOKENS = 50;

/** POST เพราะ adminToken เป็นความลับ ไม่ควรอยู่ใน URL */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { tokens?: unknown } | null;
  const tokens = body?.tokens;
  if (
    !Array.isArray(tokens) ||
    tokens.length > MAX_TOKENS ||
    !tokens.every((t) => typeof t === "string" && t.length > 0 && t.length <= 64)
  ) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const bills = await getBillSummaries(tokens);
    return NextResponse.json({ bills });
  } catch (e) {
    if (e instanceof NotConfiguredError) {
      return NextResponse.json({ error: "เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า Supabase" }, { status: 503 });
    }
    console.error("getBillSummaries failed", e);
    return NextResponse.json({ error: "โหลดรายการบิลไม่สำเร็จ" }, { status: 500 });
  }
}
