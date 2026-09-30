/**
 * แปลงข้อความที่ OCR อ่านจากใบเสร็จ → รายการอาหาร + ยอดรวม/ค่าบริการ/VAT
 * เป็นแค่ heuristic (ไม่ใช้ AI) จึงต้องมีหน้าให้ผู้ใช้ตรวจแก้ก่อนนำไปใช้เสมอ
 */
export type ScannedItem = { name: string; priceSatang: number };

export type ParsedReceipt = {
  items: ScannedItem[];
  /** ยอดก่อนค่าบริการ/VAT ถ้าใบเสร็จพิมพ์ไว้ (ใช้เทียบกับผลรวมรายการ) */
  subtotalSatang: number | null;
  /** ยอดสุทธิที่ต้องจ่าย */
  totalSatang: number | null;
  servicePct: number | null;
  vatPct: number | null;
};

const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";
const MAX_PRICE_SATANG = 500_000 * 100;

// บรรทัดที่ไม่ใช่รายการอาหาร (ไทยจับแบบ substring, อังกฤษจับเป็นคำ)
const SKIP_TH =
  /(รวม|ยอด|สุทธิ|ภาษี|ค่าบริการ|เซอร์วิส|ส่วนลด|เงินสด|เงินทอน|ทอน|โทร|เลขที่|เลขประจำตัว|ใบเสร็จ|ใบกำกับ|โต๊ะ|บัตร|ขอบคุณ|พนักงาน|วันที่|เวลา|พร้อมเพย์|สาขา|ที่อยู่|จำนวน|รายการ|ราคา|แต้ม|สะสม)/;
const SKIP_EN =
  /\b(total|subtotal|sub\s*total|grand|net|vat|service|discount|cash|change|tax|tel|fax|receipt|invoice|table|credit|card|thank|thanks|cashier|date|time|promptpay|branch|address|qty|price|amount|item|items|point|points)\b/i;

const TOTAL_RE = /(รวมทั้งสิ้น|ยอดรวมสุทธิ|ยอดสุทธิ|สุทธิ|รวมเงินทั้งสิ้น|ยอดชำระ|ยอดรวม|grand\s*total|net\s*total|\btotal\b)/i;
const SUBTOTAL_RE = /(^\s*รวม(?!ทั้งสิ้น|สุทธิ)|รวมเงิน(?!ทั้งสิ้น)|ราคารวม|sub\s*total|subtotal)/i;

/** เลขไทย → อาราบิก, ตัดช่องว่างที่ Tesseract ชอบแทรกระหว่างอักษรไทย, ล้างตัวอักษรขยะ */
export function normalizeText(raw: string): string {
  return raw
    .replace(/[๐-๙]/g, (d) => String(THAI_DIGITS.indexOf(d)))
    .replace(/ํา/g, "ำ") // Tesseract มักอ่านสระ “ำ” เป็น นิคหิต+า แยกกัน
    .replace(/[|¦_~]/g, " ")
    .replace(/(?<=[฀-๿])[ \t]+(?=[฀-๿])/g, "")
    .replace(/[ \t]+/g, " ");
}

/** จับจำนวนเงินท้ายบรรทัด: 1,200.00 / 120 / 120,00 / 85.5 บาท → สตางค์ */
const MONEY_END = /(\d[\d,]*)(?:[.,](\d{1,2}))?[ \t]*(?:฿|บาท|thb|b)?[ \t]*$/i;

function toSatang(intPart: string, dec: string | undefined): number {
  const baht = Number(intPart.replace(/,/g, ""));
  const satang = dec ? Number(dec.padEnd(2, "0")) : 0;
  return Math.round(baht * 100 + satang);
}

function lastMoney(line: string): { satang: number; index: number } | null {
  const m = MONEY_END.exec(line);
  if (!m) return null;
  const satang = toSatang(m[1], m[2]);
  return Number.isFinite(satang) ? { satang, index: m.index } : null;
}

const looksLikeIdOrDate = (s: string) =>
  /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(s) || /\d{2}:\d{2}/.test(s) || /\d{9,}/.test(s.replace(/[,\s-]/g, ""));

const pctIn = (line: string) => {
  const m = /(\d{1,2}(?:\.\d+)?)\s*%/.exec(line);
  return m ? Number(m[1]) : null;
};

export function parseReceipt(raw: string): ParsedReceipt {
  const lines = normalizeText(raw)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const out: ParsedReceipt = { items: [], subtotalSatang: null, totalSatang: null, servicePct: null, vatPct: null };
  const totals: number[] = [];

  for (const line of lines) {
    const isService = /(service|ค่าบริการ|เซอร์วิส)/i.test(line);
    const isVat = /(\bvat\b|ภาษีมูลค่าเพิ่ม|ภาษี)/i.test(line);
    if (isService) out.servicePct ??= pctIn(line);
    if (isVat) out.vatPct ??= pctIn(line);

    const money = lastMoney(line);

    if (money && TOTAL_RE.test(line) && !SUBTOTAL_RE.test(line)) totals.push(money.satang);
    else if (money && SUBTOTAL_RE.test(line)) out.subtotalSatang = money.satang;

    if (SKIP_TH.test(line) || SKIP_EN.test(line)) continue;
    if (!money || money.satang <= 0 || money.satang > MAX_PRICE_SATANG) continue;
    if (looksLikeIdOrDate(line)) continue;

    // ส่วนหน้าราคา = ชื่อ (+ จำนวน / ราคาต่อหน่วย)
    let rest = line.slice(0, money.index).replace(/[.\-–_=*:@·•…]+\s*$/g, "").trim();
    let qty = 1;

    // จำนวนนำหน้า: "2 ส้มตำ" / "2x ส้มตำ"
    const lead = /^(\d{1,2})\s*[xX×]?\s+(?=\D)/.exec(rest);
    if (lead) {
      qty = Number(lead[1]);
      rest = rest.slice(lead[0].length);
    }

    // ตัวเลขท้ายชื่อ: "ต้มยำ 2 x 180.00" → จำนวน 2, ราคาต่อหน่วย 180.00
    const tokens = rest.split(/\s+/);
    const popped: string[] = [];
    while (tokens.length > 1 && popped.length < 3 && /^(?:[xX×]|\d[\d,]*(?:[.,]\d{1,2})?)$/.test(tokens[tokens.length - 1])) {
      popped.unshift(tokens.pop()!);
    }
    const qtyTok = popped.find((t) => /^\d{1,2}$/.test(t));
    if (qtyTok && qty === 1) qty = Number(qtyTok);
    rest = tokens.join(" ").replace(/^[\s.\-–_=*:@·•…]+|[\s.\-–_=*:@·•…]+$/g, "").trim();

    if ((rest.match(/[A-Za-z฀-๿]/g) ?? []).length < 2) continue;
    // จำนวนเกิน 20 ต่อรายการแทบเป็นไปไม่ได้ในมื้อร้านอาหาร → น่าจะอ่านเลขผิด (เช่น “1” เป็น “71”) ไม่ใส่ ×
    const showQty = qty > 1 && qty <= 20;
    out.items.push({ name: showQty ? `${rest} ×${qty}` : rest, priceSatang: money.satang });
  }

  // ยอดสุทธิ = ค่ามากสุดในบรรทัดที่เป็น "รวมสุทธิ/total" (ปกติยอดสุทธิใหญ่สุด)
  out.totalSatang = totals.length ? Math.max(...totals) : null;
  return out;
}
