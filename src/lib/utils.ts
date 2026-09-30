import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** สตางค์ → "1,234.50" */
export function formatBaht(satang: number) {
  return (satang / 100).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "123.5" → 12350 สตางค์ (คืน 0 ถ้าไม่ใช่ตัวเลข) */
export function parseBaht(input: string) {
  const n = Number(input.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

/** กรองให้เหลือเฉพาะตัวเลข + จุดทศนิยมได้ 1 จุด (ทศนิยมไม่เกิน 2 หลัก) */
export function sanitizeAmount(input: string) {
  const [int, ...rest] = input.replace(/[^\d.]/g, "").split(".");
  const head = int.slice(0, 7);
  return rest.length === 0 ? head : `${head}.${rest.join("").slice(0, 2)}`;
}

export const uid = () => Math.random().toString(36).slice(2, 9);
