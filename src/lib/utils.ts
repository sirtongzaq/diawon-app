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

export const uid = () => Math.random().toString(36).slice(2, 9);
