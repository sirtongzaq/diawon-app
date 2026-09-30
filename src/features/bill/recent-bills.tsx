"use client";
import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePersistedString } from "@/hooks/use-persisted-string";
import { parseRecent, RECENT_KEY } from "@/lib/recent-bills";
import { formatBaht } from "@/lib/utils";

const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("th-TH", { day: "numeric", month: "short" });

/** บิลที่เคยสร้างจากเครื่องนี้ (เก็บใน localStorage) */
export function RecentBills() {
  const [raw] = usePersistedString(RECENT_KEY);
  const bills = useMemo(() => parseRecent(raw).slice(0, 5), [raw]);

  if (bills.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-card/60 px-4 py-8 text-center">
        <p className="text-sm text-stone-500">ยังไม่มีบิล</p>
        <p className="mt-1 text-xs text-stone-400">บิลที่สร้างจะมาอยู่ตรงนี้</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {bills.map((b) => (
        <li key={b.adminToken}>
          <Link
            href={`/manage/${b.adminToken}`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-card p-4 transition hover:bg-stone-50 active:scale-[0.99]"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{b.title}</p>
              <p className="text-xs text-stone-500">
                {fmtDate(b.createdAt)} · {b.count} คน
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1 font-extrabold tracking-tight">
              ฿{formatBaht(b.total)}
              <ChevronRight className="size-4 text-stone-400" aria-hidden="true" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
