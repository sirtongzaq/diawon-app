import test from "node:test";
import assert from "node:assert/strict";
import { normalizeText, parseReceipt } from "./receipt-parse";

const SAMPLE = `ร้านอร่อยดี สาขาสยาม
โทร 02-123-4567
วันที่ 12/09/2026 เวลา 19:45
โต๊ะ 5
รายการ จำนวน ราคา
ผัดไทยกุ้งสด 1 120.00
ต้มยำกุ้ง 2 x 180.00 360.00
เบียร์ช้าง 3 195.00
2 ส้มตำไทย 100.00
รวม 775.00
Service Charge 10% 77.50
VAT 7% 59.68
ยอดรวมสุทธิ 912.18
ขอบคุณที่ใช้บริการ`;

test("normalizeText: เลขไทย และช่องว่างระหว่างอักษรไทย", () => {
  assert.equal(normalizeText("ผัด ไทย ๑๒๐.๐๐"), "ผัดไทย 120.00");
  assert.equal(normalizeText("Pad Thai 120"), "Pad Thai 120");
});

test("parseReceipt: ใบเสร็จร้านอาหารไทยทั่วไป", () => {
  const r = parseReceipt(SAMPLE);
  assert.deepEqual(
    r.items.map((i) => [i.name, i.priceSatang]),
    [
      ["ผัดไทยกุ้งสด", 12000],
      ["ต้มยำกุ้ง ×2", 36000],
      ["เบียร์ช้าง ×3", 19500],
      ["ส้มตำไทย ×2", 10000],
    ],
  );
  assert.equal(r.subtotalSatang, 77500);
  assert.equal(r.totalSatang, 91218);
  assert.equal(r.servicePct, 10);
  assert.equal(r.vatPct, 7);
  assert.equal(r.items.reduce((s, i) => s + i.priceSatang, 0), r.subtotalSatang);
});

test("parseReceipt: เลขไทย ช่องว่างแทรก ราคาไม่มีทศนิยม และ 1,200.00", () => {
  const r = parseReceipt("ข้าว ผัด หมู ๖๕\nหมูกระทะ ชุดใหญ่ 1,200.00\nTotal 1,265.00");
  assert.deepEqual(
    r.items.map((i) => [i.name, i.priceSatang]),
    [
      ["ข้าวผัดหมู", 6500],
      ["หมูกระทะชุดใหญ่", 120000],
    ],
  );
  assert.equal(r.totalSatang, 126500);
});

test("parseReceipt: แก้ความเพี้ยนที่ Tesseract ภาษาไทยมักทำ (สระ ำ แยกเป็น ํา, จำนวนอ่านผิดเป็น 71)", () => {
  const r = parseReceipt("ต้มยํากุ้ง 2 360.00\nผัดไทยกุ้งสด 71 120.00");
  assert.deepEqual(
    r.items.map((i) => [i.name, i.priceSatang]),
    [
      ["ต้มยำกุ้ง ×2", 36000],
      ["ผัดไทยกุ้งสด", 12000],
    ],
  );
});

test("parseReceipt: ไม่เอาบรรทัดเบอร์โทร วันที่ ยอดรวม มาเป็นรายการ", () => {
  const r = parseReceipt("Tel 0812345678\n12/09/2026 19:45\nรวม 500.00\nยอดรวมสุทธิ 500.00\nเลขที่ 000123456789");
  assert.equal(r.items.length, 0);
  assert.equal(r.totalSatang, 50000);
});

test("parseReceipt: ข้อความว่างหรือขยะไม่ทำให้พัง", () => {
  assert.equal(parseReceipt("").items.length, 0);
  assert.equal(parseReceipt("@@@ ### 12").items.length, 0);
});
