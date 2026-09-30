"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Copy, FileImage, Send, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn, formatBaht } from "@/lib/utils";

type P = {
  id: string;
  name: string;
  token: string;
  total: number;
  paid: boolean;
  /** เพื่อนส่งสลิปมาแล้วหรือยัง */
  hasSlip: boolean;
  /** signed URL อายุสั้น (null ถ้าสร้างไม่ได้) */
  slipUrl: string | null;
  slipAt: string | null;
};

const linkFor = (token: string) => `${window.location.origin}/p/${token}`;
const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

export function ManageBill({
  adminToken,
  title,
  total,
  people,
}: {
  adminToken: string;
  title: string;
  total: number;
  people: P[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const paidCount = people.filter((p) => p.paid).length;
  const paidSum = people.filter((p) => p.paid).reduce((s, p) => s + p.total, 0);
  const pending = people.filter((p) => p.hasSlip && !p.paid);
  const viewing = people.find((p) => p.id === viewingId) ?? null;

  async function call(path: string, body: object, personId: string, fallback: string) {
    setBusy(personId);
    setError(null);
    try {
      const res = await fetch(`/api/manage/${adminToken}/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? fallback);
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : fallback);
      return false;
    } finally {
      setBusy(null);
    }
  }

  const setPaid = (p: P, paid: boolean) =>
    call("paid", { personId: p.id, paid }, p.id, "อัปเดตไม่สำเร็จ");

  async function approve(p: P) {
    if (await setPaid(p, true)) setViewingId(null);
  }
  async function reject(p: P) {
    if (await call("slip/reject", { personId: p.id }, p.id, "ทำรายการไม่สำเร็จ")) setViewingId(null);
  }

  async function copy(p: P) {
    try {
      await navigator.clipboard.writeText(linkFor(p.token));
      setCopied(p.id);
      setTimeout(() => setCopied((c) => (c === p.id ? null : c)), 1500);
    } catch {
      setError("คัดลอกไม่ได้ ลองกดแชร์ผ่าน LINE แทนนะ");
    }
  }

  function shareLine(p: P) {
    const text = `${p.name} ยอด ฿${formatBaht(p.total)} (${title})\nโอนได้ที่นี่ ${linkFor(p.token)}`;
    window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-4 pb-32">
      <section>
        <Link href="/bills" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-ink">
          <ChevronLeft className="size-4" aria-hidden="true" />
          รายการบิล
        </Link>
        <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight">{title}</h1>
        <div className="mt-4 rounded-2xl border border-stone-200 bg-card p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-stone-500">โอนแล้ว {paidCount}/{people.length} คน</span>
            <span className="text-sm font-semibold">฿{formatBaht(paidSum)} / ฿{formatBaht(total)}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-valuemin={0} aria-valuemax={people.length} aria-valuenow={paidCount}>
            <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${people.length ? (paidCount / people.length) * 100 : 0}%` }} />
          </div>
        </div>
      </section>

      {pending.length > 0 && (
        <button
          onClick={() => setViewingId(pending[0].id)}
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-amber-800 transition active:scale-[0.99]"
        >
          <TriangleAlert className="size-5 shrink-0" aria-hidden="true" />
          <span className="text-sm">
            <span className="block font-semibold">มีหลักฐานการโอน {pending.length} รายการ รอคุณตรวจ</span>
            <span className="opacity-80">แตะเพื่อดูสลิปและกดอนุมัติ</span>
          </span>
        </button>
      )}

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <ul className="flex flex-col gap-3">
        {people.map((p) => {
          const waiting = p.hasSlip && !p.paid;
          return (
            <li
              key={p.id}
              className={cn(
                "rounded-2xl border bg-card p-4",
                waiting ? "border-amber-200" : "border-stone-200",
                p.paid && "opacity-70",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-lg font-extrabold tracking-tight">฿{formatBaht(p.total)}</p>
                </div>
                <button
                  onClick={() => setPaid(p, !p.paid)}
                  disabled={busy === p.id}
                  aria-pressed={p.paid}
                  className={cn(
                    "flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition active:scale-95 disabled:opacity-50",
                    p.paid
                      ? "border-brand bg-brand text-on-brand"
                      : waiting
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-stone-200 text-stone-600 hover:bg-stone-100",
                  )}
                >
                  <Check className="size-4" aria-hidden="true" />
                  {p.paid ? "โอนแล้ว" : waiting ? "รอตรวจสลิป" : "ยังไม่โอน"}
                </button>
              </div>

              {p.hasSlip && (
                <button
                  onClick={() => setViewingId(p.id)}
                  className={cn(
                    "mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition active:scale-[0.99]",
                    waiting ? "bg-amber-50 text-amber-800" : "bg-stone-100 text-stone-600",
                  )}
                >
                  <FileImage className="size-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1">
                    {waiting ? "มีหลักฐานการโอน · ตรวจสลิป" : "ดูสลิปที่แนบมา"}
                    <span className="ml-1.5 text-xs font-normal opacity-70">{fmtTime(p.slipAt)}</span>
                  </span>
                </button>
              )}

              <div className="mt-3 flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1" disabled={p.paid} onClick={() => copy(p)}>
                  <Copy className="size-4" aria-hidden="true" />
                  {copied === p.id ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                </Button>
                <Button variant="accent" size="sm" className="flex-1" disabled={p.paid} onClick={() => shareLine(p)}>
                  <Send className="size-4" aria-hidden="true" />
                  ส่งใน LINE
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-center text-xs text-stone-400">
        เก็บลิงก์หน้านี้ไว้ เพราะเป็นทางเดียวที่จะกลับมาจัดการบิล
      </p>

      {/* ดูสลิป + อนุมัติ / ไม่อนุมัติ */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewingId(null)}>
        <SheetContent>
          {viewing && (
            <>
              <SheetDescription className="text-sm text-stone-500">
                {viewing.paid ? "สลิปที่อนุมัติแล้ว" : "หลักฐานการโอน"} · {fmtTime(viewing.slipAt)}
              </SheetDescription>
              <SheetTitle className="mt-0.5 text-lg font-bold">
                {viewing.name} · ฿{formatBaht(viewing.total)}
              </SheetTitle>

              <div className="mt-4 flex min-h-40 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                {viewing.slipUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={viewing.slipUrl} alt={`สลิปของ ${viewing.name}`} className="max-h-[52dvh] w-full object-contain" />
                ) : (
                  <p className="px-4 py-10 text-center text-sm text-stone-500">โหลดรูปสลิปไม่สำเร็จ ลองรีเฟรชหน้านี้</p>
                )}
              </div>

              {!viewing.paid ? (
                <div className="mt-5 flex flex-col gap-2">
                  <Button size="lg" disabled={busy === viewing.id} onClick={() => approve(viewing)}>
                    <Check className="size-5" aria-hidden="true" />
                    อนุมัติ ยืนยันว่าโอนแล้ว
                  </Button>
                  <Button variant="ghost" disabled={busy === viewing.id} onClick={() => reject(viewing)}>
                    ไม่อนุมัติ ให้ส่งสลิปใหม่
                  </Button>
                  <p className="text-center text-xs text-stone-400">ไม่อนุมัติ = ลบสลิปนี้ทิ้ง เพื่อนจะส่งใหม่ได้</p>
                </div>
              ) : (
                <SheetClose asChild>
                  <Button variant="ghost" className="mt-5 w-full">ปิด</Button>
                </SheetClose>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
