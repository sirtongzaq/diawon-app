"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { usePersistedString } from "@/hooks/use-persisted-string";
import { parseRecent, RECENT_KEY, type RecentBill } from "@/lib/recent-bills";
import { cn, formatBaht } from "@/lib/utils";

type Summary = {
  adminToken: string;
  title: string;
  total: number;
  paidSum: number;
  count: number;
  paidCount: number;
  pendingSlips: number;
  createdAt: string;
};
type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; byToken: Record<string, Summary> };

const fmtDate = (t: number | string) =>
  new Date(t).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

/** รายการบิลทั้งหมดที่สร้างจากเครื่องนี้ + สถานะโอนล่าสุดจากเซิร์ฟเวอร์ */
export function BillsList() {
  const [raw, setRaw] = usePersistedString(RECENT_KEY);
  const local = useMemo(() => parseRecent(raw), [raw]);
  const tokensKey = local.map((b) => b.adminToken).join(",");
  const [state, setState] = useState<State>({ status: "loading" });
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");

  useEffect(() => {
    if (!tokensKey) return;
    const ac = new AbortController();
    fetch("/api/bills/summary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tokens: tokensKey.split(",") }),
      signal: ac.signal,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "โหลดรายการบิลไม่สำเร็จ");
        const byToken = Object.fromEntries((data.bills as Summary[]).map((b) => [b.adminToken, b]));
        setState({ status: "ok", byToken });
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setState({ status: "error", message: e?.message ?? "โหลดรายการบิลไม่สำเร็จ" });
      });
    return () => ac.abort();
  }, [tokensKey]);

  function forget(b: RecentBill) {
    setRaw(JSON.stringify(local.filter((x) => x.adminToken !== b.adminToken)));
  }

  const byToken = state.status === "ok" ? state.byToken : {};
  const rows = local
    .map((b) => ({ local: b, live: byToken[b.adminToken] as Summary | undefined }))
    .filter(({ live }) => {
      if (filter === "all" || !live) return true;
      const done = live.count > 0 && live.paidCount === live.count;
      return filter === "done" ? done : !done;
    });

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-5 pt-4 pb-32">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">จัดการบิล</p>
          <h1 className="text-2xl font-extrabold tracking-tight">รายการบิล</h1>
        </div>
        <Link href="/bill" className={buttonVariants({ size: "sm" })}>
          <Plus className="size-4" aria-hidden="true" />
          สร้างบิล
        </Link>
      </div>

      {local.length > 0 && (
        <div role="tablist" aria-label="กรองบิล" className="flex gap-1.5">
          {(
            [
              ["all", "ทั้งหมด"],
              ["open", "ยังไม่ครบ"],
              ["done", "ครบแล้ว"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                filter === key
                  ? "border-accent bg-accent text-white"
                  : "border-stone-200 bg-card text-stone-600 hover:bg-stone-100",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {state.status === "error" && local.length > 0 && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.message} (แสดงข้อมูลที่จำไว้ในเครื่องแทน)
        </p>
      )}

      {local.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-card/60 px-4 py-10 text-center">
          <p className="font-semibold">ยังไม่มีบิล</p>
          <p className="mt-1 text-sm text-stone-500">บิลที่สร้างจากเครื่องนี้จะมาอยู่ตรงนี้</p>
          <Link href="/bill" className={cn(buttonVariants(), "mt-4")}>
            สร้างบิลแรก
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(({ local: b, live }) => {
            const loaded = state.status === "ok";
            const missing = loaded && !live;
            const done = !!live && live.count > 0 && live.paidCount === live.count;
            const pct = live && live.count ? (live.paidCount / live.count) * 100 : 0;
            return (
              <li key={b.adminToken} className="rounded-2xl border border-stone-200 bg-card">
                {missing ? (
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{b.title}</p>
                      <p className="text-xs text-stone-500">ไม่พบบิลนี้บนเซิร์ฟเวอร์แล้ว</p>
                    </div>
                    <button
                      onClick={() => forget(b)}
                      aria-label={`ลบ ${b.title} ออกจากรายการ`}
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-ink"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <Link href={`/manage/${b.adminToken}`} className="block p-4 transition active:scale-[0.99]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{live?.title ?? b.title}</p>
                        <p className="text-xs text-stone-500">
                          {fmtDate(live?.createdAt ?? b.createdAt)} · {live?.count ?? b.count} คน
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 font-extrabold tracking-tight">
                        ฿{formatBaht(live?.total ?? b.total)}
                        <ChevronRight className="size-4 text-stone-400" aria-hidden="true" />
                      </span>
                    </div>
                    {!!live?.pendingSlips && (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        <span className="size-1.5 rounded-full bg-amber-600" aria-hidden="true" />
                        มีสลิปรอตรวจ {live.pendingSlips} รายการ
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
                        <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className={cn("shrink-0 text-xs font-semibold", done ? "text-accent" : "text-stone-500")}>
                        {live ? (done ? "ครบแล้ว" : `โอนแล้ว ${live.paidCount}/${live.count}`) : "กำลังโหลด…"}
                      </span>
                    </div>
                  </Link>
                )}
              </li>
            );
          })}
          {rows.length === 0 && <li className="py-8 text-center text-sm text-stone-500">ไม่มีบิลในกลุ่มนี้</li>}
        </ul>
      )}

      {local.length > 0 && (
        <p className="text-center text-xs text-stone-400">แสดงเฉพาะบิลที่สร้างจากเครื่องนี้</p>
      )}
    </main>
  );
}
