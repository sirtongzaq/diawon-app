import { NextResponse } from "next/server";
import { sniffImage } from "@/lib/slip-file";
import { NotConfiguredError, saveSlip, SLIP_MAX_BYTES } from "@/lib/server/bills";

export async function POST(req: Request, ctx: RouteContext<"/api/p/[token]/slip">) {
  const { token } = await ctx.params;

  // เช็กขนาดจาก header ก่อน จะได้ไม่ต้องอ่านทั้งไฟล์ถ้าใหญ่เกิน
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > SLIP_MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกินไป (ไม่เกิน 4 MB)" }, { status: 413 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ไม่พบไฟล์สลิป" }, { status: 400 });
  }
  if (file.size === 0 || file.size > SLIP_MAX_BYTES) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกินไป (ไม่เกิน 4 MB)" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) {
    return NextResponse.json({ error: "ใช้ได้เฉพาะรูป JPG, PNG หรือ WEBP" }, { status: 415 });
  }

  try {
    const result = await saveSlip(token, { bytes, ...kind });
    if (result === "not_found") return NextResponse.json({ error: "ไม่พบลิงก์นี้" }, { status: 404 });
    if (result === "already_paid") {
      return NextResponse.json({ error: "บิลนี้ยืนยันการโอนแล้ว" }, { status: 409 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (e instanceof NotConfiguredError) {
      return NextResponse.json({ error: "เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า Supabase" }, { status: 503 });
    }
    console.error("saveSlip failed", e);
    return NextResponse.json({ error: "ส่งสลิปไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
