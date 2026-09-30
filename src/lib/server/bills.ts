import { randomBytes } from "node:crypto";
import type { BillInput } from "@/lib/bill-input";
import { computeSplit, type Item, type Person, type SplitResult } from "@/lib/split";
import { getAdminClient } from "./supabase";

export class NotConfiguredError extends Error {
  constructor() {
    super("ยังไม่ได้ตั้งค่า Supabase");
  }
}

const token = (bytes: number) => randomBytes(bytes).toString("base64url");

function db() {
  const client = getAdminClient();
  if (!client) throw new NotConfiguredError();
  return client;
}

export type BillRow = {
  id: string;
  title: string;
  promptpay_id: string;
  service_pct: number;
  vat_pct: number;
  admin_token: string;
  created_at: string;
};
export type PersonRow = {
  id: string;
  bill_id: string;
  position: number;
  name: string;
  token: string;
  total_satang: number;
  paid_at: string | null;
  /** path ของสลิปใน bucket "slips" (private) */
  slip_path: string | null;
  slip_uploaded_at: string | null;
};
type ItemRow = {
  id: string;
  name: string;
  price_satang: number;
  person_ids: string[];
};

export type BillView = {
  bill: BillRow;
  people: PersonRow[];
  split: SplitResult;
};

/** สร้างบิล + เพื่อนทุกคน + รายการ; คำนวณยอดฝั่งเซิร์ฟเวอร์ทั้งหมด */
export async function createBill(input: BillInput) {
  const supabase = db();
  const fees = { servicePct: input.servicePct, vatPct: input.vatPct };

  // คำนวณด้วย id ชั่วคราวเป็น index ก่อน เพื่อได้ยอดรายคนที่จะบันทึก
  const tmpPeople: Person[] = input.people.map((p, i) => ({ id: String(i), name: p.name }));
  const tmpItems: Item[] = input.items.map((it, i) => ({
    id: String(i),
    name: it.name,
    price: it.priceSatang,
    people: it.people.map(String),
  }));
  const split = computeSplit(tmpPeople, tmpItems, fees);

  const adminToken = token(16);
  const { data: bill, error: billErr } = await supabase
    .from("bills")
    .insert({
      title: input.title,
      promptpay_id: input.promptPayId,
      service_pct: input.servicePct,
      vat_pct: input.vatPct,
      admin_token: adminToken,
    })
    .select("id")
    .single();
  if (billErr || !bill) throw new Error(billErr?.message ?? "สร้างบิลไม่สำเร็จ");

  try {
    const { data: people, error: pErr } = await supabase
      .from("people")
      .insert(
        input.people.map((p, i) => ({
          bill_id: bill.id,
          position: i,
          name: p.name,
          token: token(12),
          total_satang: split.shares[i].total,
        })),
      )
      .select("id, position, name, token, total_satang");
    if (pErr || !people) throw new Error(pErr?.message ?? "บันทึกเพื่อนไม่สำเร็จ");

    const idByPosition = new Map(people.map((p) => [p.position as number, p.id as string]));
    const { error: iErr } = await supabase.from("items").insert(
      input.items.map((it, i) => ({
        bill_id: bill.id,
        position: i,
        name: it.name,
        price_satang: it.priceSatang,
        person_ids: it.people.map((idx) => idByPosition.get(idx)!),
      })),
    );
    if (iErr) throw new Error(iErr.message);

    return { adminToken, total: split.total };
  } catch (e) {
    await supabase.from("bills").delete().eq("id", bill.id); // cascade ลบลูกให้
    throw e;
  }
}

async function loadByBill(bill: BillRow): Promise<BillView> {
  const supabase = db();
  const [peopleRes, itemsRes] = await Promise.all([
    supabase.from("people").select("*").eq("bill_id", bill.id).order("position"),
    supabase.from("items").select("id, name, price_satang, person_ids").eq("bill_id", bill.id).order("position"),
  ]);
  if (peopleRes.error) throw new Error(peopleRes.error.message);
  if (itemsRes.error) throw new Error(itemsRes.error.message);

  const people = peopleRes.data as PersonRow[];
  const items: Item[] = (itemsRes.data as ItemRow[]).map((it) => ({
    id: it.id,
    name: it.name,
    price: it.price_satang,
    people: it.person_ids,
  }));
  const split = computeSplit(
    people.map((p) => ({ id: p.id, name: p.name })),
    items,
    { servicePct: Number(bill.service_pct), vatPct: Number(bill.vat_pct) },
  );
  return { bill, people, split };
}

export async function getBillByAdminToken(adminToken: string): Promise<BillView | null> {
  const { data, error } = await db().from("bills").select("*").eq("admin_token", adminToken).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? loadByBill(data as BillRow) : null;
}

/** เพื่อนเปิดลิงก์ส่วนตัว → ได้บิล + ตัวเองในบิลนั้น */
export async function getBillByPersonToken(personToken: string) {
  const supabase = db();
  const { data: person, error } = await supabase.from("people").select("*").eq("token", personToken).maybeSingle();
  if (error) throw new Error(error.message);
  if (!person) return null;
  const { data: bill, error: bErr } = await supabase.from("bills").select("*").eq("id", person.bill_id).single();
  if (bErr || !bill) throw new Error(bErr?.message ?? "ไม่พบบิล");
  const view = await loadByBill(bill as BillRow);
  const me = view.people.find((p) => p.id === person.id)!;
  const share = view.split.shares.find((s) => s.personId === me.id)!;
  return { bill: view.bill, me, share, allPaid: view.people.every((p) => p.paid_at) };
}

/** เจ้าของบิลติ๊ก/ยกเลิก "โอนแล้ว" ของเพื่อนคนหนึ่ง (เช็กว่าคนนั้นอยู่ในบิลของ adminToken นี้จริง) */
export async function setPaid(adminToken: string, personId: string, paid: boolean) {
  const supabase = db();
  const { data: bill, error } = await supabase.from("bills").select("id").eq("admin_token", adminToken).maybeSingle();
  if (error) throw new Error(error.message);
  if (!bill) return false;
  const { data, error: uErr } = await supabase
    .from("people")
    .update({ paid_at: paid ? new Date().toISOString() : null })
    .eq("id", personId)
    .eq("bill_id", bill.id)
    .select("id");
  if (uErr) throw new Error(uErr.message);
  return (data?.length ?? 0) > 0;
}

export type BillSummary = {
  adminToken: string;
  title: string;
  total: number; // สตางค์
  paidSum: number;
  count: number;
  paidCount: number;
  /** จำนวนสลิปที่ส่งมาแล้วรอเจ้าของบิลตรวจ */
  pendingSlips: number;
  createdAt: string;
};

/** สรุปหลายบิลทีเดียวสำหรับหน้ารายการบิล (ส่ง adminToken เป็นชุด) */
export async function getBillSummaries(adminTokens: string[]): Promise<BillSummary[]> {
  if (adminTokens.length === 0) return [];
  const supabase = db();
  const { data: bills, error } = await supabase
    .from("bills")
    .select("id, title, admin_token, created_at")
    .in("admin_token", adminTokens);
  if (error) throw new Error(error.message);
  if (!bills?.length) return [];

  const { data: people, error: pErr } = await supabase
    .from("people")
    .select("bill_id, total_satang, paid_at, slip_path")
    .in("bill_id", bills.map((b) => b.id));
  if (pErr) throw new Error(pErr.message);

  return bills.map((b) => {
    const mine = (people ?? []).filter((p) => p.bill_id === b.id);
    const paid = mine.filter((p) => p.paid_at);
    return {
      adminToken: b.admin_token as string,
      title: b.title as string,
      total: mine.reduce((s, p) => s + (p.total_satang as number), 0),
      paidSum: paid.reduce((s, p) => s + (p.total_satang as number), 0),
      count: mine.length,
      paidCount: paid.length,
      pendingSlips: mine.filter((p) => p.slip_path && !p.paid_at).length,
      createdAt: b.created_at as string,
    };
  });
}

// ---------------------------------------------------------------- สลิปโอนเงิน

export const SLIP_BUCKET = "slips";
export const SLIP_MAX_BYTES = 4 * 1024 * 1024; // Vercel จำกัด body ~4.5MB
const SLIP_URL_TTL = 60 * 60; // วินาที

export type SlipResult = "ok" | "not_found" | "already_paid";

/** เพื่อนอัปโหลดสลิปด้วยลิงก์ส่วนตัวของตัวเอง (ไฟล์ตรวจชนิด/ขนาดมาแล้วจาก route) */
export async function saveSlip(
  personToken: string,
  file: { bytes: Uint8Array; contentType: string; ext: string },
): Promise<SlipResult> {
  const supabase = db();
  const { data: person, error } = await supabase
    .from("people")
    .select("id, bill_id, paid_at, slip_path")
    .eq("token", personToken)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!person) return "not_found";
  if (person.paid_at) return "already_paid";

  const path = `${person.bill_id}/${person.id}-${Date.now()}.${file.ext}`;
  const { error: upErr } = await supabase.storage
    .from(SLIP_BUCKET)
    .upload(path, file.bytes, { contentType: file.contentType, upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { error: uErr } = await supabase
    .from("people")
    .update({ slip_path: path, slip_uploaded_at: new Date().toISOString() })
    .eq("id", person.id);
  if (uErr) {
    await supabase.storage.from(SLIP_BUCKET).remove([path]);
    throw new Error(uErr.message);
  }
  // ส่งใหม่ → ลบไฟล์เก่าทิ้ง (ไม่ให้ error ตรงนี้ทำให้ทั้งหมดล้ม)
  if (person.slip_path) await supabase.storage.from(SLIP_BUCKET).remove([person.slip_path]);
  return "ok";
}

/** เจ้าของบิลไม่อนุมัติสลิป → ลบสลิป ให้เพื่อนส่งใหม่ได้ */
export async function rejectSlip(adminToken: string, personId: string) {
  const supabase = db();
  const { data: bill, error } = await supabase.from("bills").select("id").eq("admin_token", adminToken).maybeSingle();
  if (error) throw new Error(error.message);
  if (!bill) return false;

  const { data: person, error: pErr } = await supabase
    .from("people")
    .select("id, slip_path")
    .eq("id", personId)
    .eq("bill_id", bill.id)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if (!person) return false;

  const { error: uErr } = await supabase
    .from("people")
    .update({ slip_path: null, slip_uploaded_at: null })
    .eq("id", person.id);
  if (uErr) throw new Error(uErr.message);
  if (person.slip_path) await supabase.storage.from(SLIP_BUCKET).remove([person.slip_path]);
  return true;
}

/** signed URL อายุสั้นสำหรับให้เจ้าของบิลดูสลิป (bucket เป็น private) */
export async function getSlipUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await db().storage.from(SLIP_BUCKET).createSignedUrls(paths, SLIP_URL_TTL);
  if (error) throw new Error(error.message);
  const out: Record<string, string> = {};
  for (const row of data ?? []) if (row.path && row.signedUrl) out[row.path] = row.signedUrl;
  return out;
}
