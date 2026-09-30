"use client";
import { cn } from "@/lib/utils";

/**
 * แถวชิปแนะนำ แตะเพื่อเลือก (แตะอันที่เลือกอยู่ซ้ำ = ยกเลิก ถ้าส่ง onClear มา)
 * scroll = true → แถวเดียวเลื่อนแนวนอน (โล่งกว่า) โดยขอบเลื่อนชนขอบการ์ด p-5 ที่ครอบอยู่
 */
export function SuggestChips({
  label,
  options,
  selected,
  onPick,
  onClear,
  scroll = false,
}: {
  label: string;
  options: readonly string[];
  selected?: string;
  onPick: (value: string) => void;
  onClear?: () => void;
  scroll?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex gap-1.5",
        scroll ? "-mx-5 overflow-x-auto px-5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "flex-wrap",
      )}
    >
      {options.map((o) => {
        const on = selected === o;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => (on && onClear ? onClear() : onPick(o))}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition active:scale-95",
              scroll && "shrink-0",
              on
                ? "border-accent bg-accent text-white"
                : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
