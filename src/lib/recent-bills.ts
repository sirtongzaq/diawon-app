/** รายการบิลล่าสุดที่เก็บในเครื่องนี้ (ไว้กลับมาเปิดหน้าจัดการ) */
export type RecentBill = {
  adminToken: string;
  title: string;
  total: number; // สตางค์
  count: number; // จำนวนเพื่อน
  createdAt: number;
};

export const RECENT_KEY = "diawon:bills";
const MAX = 20;

export function parseRecent(raw: string): RecentBill[] {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v)
      ? v.filter((b): b is RecentBill => typeof b?.adminToken === "string" && typeof b?.title === "string")
      : [];
  } catch {
    return [];
  }
}

export function addRecent(raw: string, bill: RecentBill): string {
  const rest = parseRecent(raw).filter((b) => b.adminToken !== bill.adminToken);
  return JSON.stringify([bill, ...rest].slice(0, MAX));
}
