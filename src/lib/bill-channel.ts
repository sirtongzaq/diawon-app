/**
 * ชื่อ channel realtime = prefix + "-" + sha256(ความลับ) 32 ตัวแรก
 * - บิล (เจ้าของฟัง):  "bill-…"   จาก adminToken → เพื่อนส่งสลิป
 * - เพื่อน (คนโอนฟัง): "person-…" จาก token ส่วนตัว → เจ้าของอนุมัติ / ไม่อนุมัติ
 * เดาไม่ได้ (token สุ่ม 96–128 บิต) และรู้ชื่อ channel ก็ย้อนกลับไปหา token ไม่ได้
 * ฝั่งเซิร์ฟเวอร์ (node:crypto) และเบราว์เซอร์ (WebCrypto) ต้องให้ผลตรงกัน
 */

// เจ้าของบิลรับ
export const SLIP_EVENT = "slip";
export type SlipPayload = { name: string; title: string };

// เพื่อนรับ
export const PAID_EVENT = "paid";
export type PaidPayload = { paid: boolean };
export const REJECT_EVENT = "slip_rejected";

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function topic(prefix: string, secret: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return `${prefix}-${hex(digest).slice(0, 32)}`;
}

export const billTopic = (adminToken: string) => topic("bill", adminToken);
export const personTopic = (personToken: string) => topic("person", personToken);
