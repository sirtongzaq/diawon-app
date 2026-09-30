import { isValidPromptPayId, normalizePromptPayId } from "./promptpay";

/** ข้อมูลบิลที่ client ส่งมาสร้าง (เงินเป็นสตางค์, people ในรายการ = index ของ people) */
export type BillInput = {
  title: string;
  promptPayId: string;
  servicePct: number;
  vatPct: number;
  people: { name: string }[];
  items: { name: string; priceSatang: number; people: number[] }[];
};

export type ParseResult =
  | { ok: true; value: BillInput }
  | { ok: false; error: string };

export const LIMITS = { people: 30, items: 100, name: 40, title: 60, maxPrice: 100_000_000 };

const fail = (error: string): ParseResult => ({ ok: false, error });
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** ตรวจ payload จากภายนอก — ไม่เชื่อค่าใดๆ ที่ client ส่งมา */
export function parseBillInput(raw: unknown): ParseResult {
  if (!isObj(raw)) return fail("ข้อมูลบิลไม่ถูกต้อง");

  const promptPayId = normalizePromptPayId(String(raw.promptPayId ?? ""));
  if (!isValidPromptPayId(promptPayId)) return fail("PromptPay ไม่ถูกต้อง");

  const servicePct = Number(raw.servicePct ?? 0);
  const vatPct = Number(raw.vatPct ?? 0);
  for (const pct of [servicePct, vatPct]) {
    if (!Number.isFinite(pct) || pct < 0 || pct > 30) return fail("ค่าบริการ/VAT ไม่ถูกต้อง");
  }

  if (!Array.isArray(raw.people) || raw.people.length < 1 || raw.people.length > LIMITS.people) {
    return fail(`ต้องมีเพื่อน 1–${LIMITS.people} คน`);
  }
  const people: BillInput["people"] = [];
  for (const p of raw.people) {
    const name = text(isObj(p) ? p.name : "", LIMITS.name);
    if (!name) return fail("ชื่อเพื่อนต้องไม่ว่าง");
    people.push({ name });
  }

  if (!Array.isArray(raw.items) || raw.items.length < 1 || raw.items.length > LIMITS.items) {
    return fail(`ต้องมีรายการ 1–${LIMITS.items} รายการ`);
  }
  const items: BillInput["items"] = [];
  for (const it of raw.items) {
    if (!isObj(it)) return fail("รายการไม่ถูกต้อง");
    const name = text(it.name, LIMITS.name);
    const priceSatang = Number(it.priceSatang);
    if (!name) return fail("ชื่อรายการต้องไม่ว่าง");
    if (!Number.isInteger(priceSatang) || priceSatang <= 0 || priceSatang > LIMITS.maxPrice) {
      return fail(`ราคา “${name}” ไม่ถูกต้อง`);
    }
    const idx = Array.isArray(it.people) ? it.people : [];
    const eaters = [...new Set(idx)];
    if (
      eaters.length === 0 ||
      !eaters.every((i) => Number.isInteger(i) && i >= 0 && i < people.length)
    ) {
      return fail(`เลือกคนกิน “${name}” ก่อน`);
    }
    items.push({ name, priceSatang, people: eaters as number[] });
  }

  return {
    ok: true,
    value: {
      title: text(raw.title, LIMITS.title) || "บิลมื้อนี้",
      promptPayId,
      servicePct,
      vatPct,
      people,
      items,
    },
  };
}
