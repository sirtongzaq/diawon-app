"use client";
import { cn } from "@/lib/utils";

/** แถวชิปแนะนำ แตะเพื่อเลือก (แตะอันที่เลือกอยู่ซ้ำ = ยกเลิก ถ้าส่ง onClear มา) */
export function SuggestChips({
  label,
  options,
  selected,
  onPick,
  onClear,
}: {
  label: string;
  options: readonly string[];
  selected?: string;
  onPick: (value: string) => void;
  onClear?: () => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected === o;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => (on && onClear ? onClear() : onPick(o))}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition active:scale-95",
              on
                ? "border-accent bg-accent text-white"
                : "border-stone-200 bg-card text-stone-600 hover:bg-stone-100",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
