import { NextResponse } from "next/server";
import { NotConfiguredError, setPaid } from "@/lib/server/bills";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/manage/[adminToken]/paid">,
) {
  const { adminToken } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { personId?: unknown; paid?: unknown } | null;

  if (typeof body?.personId !== "string" || !UUID.test(body.personId) || typeof body.paid !== "boolean") {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const ok = await setPaid(adminToken, body.personId, body.paid);
    if (!ok) return NextResponse.json({ error: "ไม่พบบิลหรือเพื่อนคนนี้" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof NotConfiguredError) {
      return NextResponse.json({ error: "เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า Supabase" }, { status: 503 });
    }
    console.error("setPaid failed", e);
    return NextResponse.json({ error: "อัปเดตไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
