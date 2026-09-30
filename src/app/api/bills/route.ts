import { NextResponse } from "next/server";
import { parseBillInput } from "@/lib/bill-input";
import { createBill, NotConfiguredError } from "@/lib/server/bills";

const MAX_BODY = 100_000;

export async function POST(req: Request) {
  const body = await req.text();
  if (body.length > MAX_BODY) {
    return NextResponse.json({ error: "ข้อมูลใหญ่เกินไป" }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "ข้อมูลบิลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = parseBillInput(json);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const created = await createBill(parsed.value);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof NotConfiguredError) {
      return NextResponse.json({ error: "เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า Supabase" }, { status: 503 });
    }
    console.error("createBill failed", e);
    return NextResponse.json({ error: "บันทึกบิลไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
