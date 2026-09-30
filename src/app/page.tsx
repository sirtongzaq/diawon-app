import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  FileCheck2,
  Link2,
  QrCode,
  Radio,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BetaBadge } from "@/features/bill/beta-badge";
import { RecentBills } from "@/features/bill/recent-bills";
import { cn } from "@/lib/utils";

const steps = [
  { title: "ใส่รายการ", desc: "พิมพ์เอง หรือสแกนใบเสร็จ แล้วเลือกว่าใครกินอะไร" },
  { title: "ส่งลิงก์ให้เพื่อน", desc: "แต่ละคนได้ลิงก์ส่วนตัว พร้อม QR PromptPay ตามยอดของตัวเอง" },
  { title: "เพื่อนโอนแล้วแนบสลิป", desc: "ส่งรูปสลิปจากลิงก์เดิม ไม่ต้องสมัครสมาชิก ไม่ต้องโหลดแอป" },
  { title: "เจ้าของกดอนุมัติ", desc: "ตรวจสลิป กดยืนยัน สถานะของเพื่อนเปลี่ยนให้ทันที" },
];

const features = [
  { icon: Sparkles, title: "หารอัตโนมัติ", desc: "รวม Service charge และ VAT ให้ ยอดรวมตรงเป๊ะ ไม่มีเศษหาย" },
  { icon: QrCode, title: "QR PromptPay รายคน", desc: "ใส่ยอดให้แล้ว สแกนจ่ายได้ทันที" },
  { icon: ScanLine, title: "สแกนใบเสร็จ", desc: "อ่านรายการจากรูปในเครื่องคุณ ไม่ส่งรูปออกไปไหน", beta: true },
  { icon: FileCheck2, title: "แนบสลิป + อนุมัติ", desc: "เก็บหลักฐานการโอน เจ้าของตรวจทีละคนได้" },
  { icon: Link2, title: "ลิงก์ส่วนตัว", desc: "เพื่อนแต่ละคนเห็นเฉพาะยอดของตัวเอง" },
  { icon: BellRing, title: "เตือนอัตโนมัติ", desc: "ให้ระบบทวงแทนเรา กำลังพัฒนา", soon: true },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 px-5 pt-4 pb-32">
      {/* Hero */}
      <section className="rounded-3xl bg-accent p-6 text-white">
        <p className="text-sm text-white/70">สวัสดี 👋</p>
        <h1 className="mt-1 text-2xl leading-snug font-extrabold tracking-tight">
          หารบิลกับเพื่อน
          <br />
          แบบไม่อึดอัด
        </h1>
        <p className="mt-2 text-sm text-white/80">
          หารให้ ส่ง QR ให้ ตรวจสลิปให้ อยู่ในที่เดียว
        </p>
        <Link
          href="/bill"
          className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-5 w-full")}
        >
          สร้างบิลใหม่
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </section>

      {/* ทำงานยังไง */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-700">ทำงานยังไง</h2>
        <ol className="flex flex-col rounded-3xl border border-stone-200 bg-card p-5">
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 pb-5 last:pb-0">
              {i < steps.length - 1 && (
                <span aria-hidden="true" className="absolute top-8 bottom-1 left-[13px] w-px bg-stone-200" />
              )}
              <span
                aria-hidden="true"
                className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-on-brand"
              >
                {i + 1}
              </span>
              <div>
                <p className="leading-7 font-semibold">{s.title}</p>
                <p className="text-sm text-stone-500">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Realtime */}
      <section
        aria-labelledby="realtime-title"
        className="flex gap-4 rounded-3xl border border-stone-200 bg-card p-5"
      >
        <span className="relative mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/20 text-ink">
          <Radio className="size-5" aria-hidden="true" />
          <span className="absolute top-0 right-0 flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-70" />
            <span className="relative inline-flex size-3 rounded-full bg-brand" />
          </span>
        </span>
        <div>
          <h2 id="realtime-title" className="font-bold">อัปเดตแบบ realtime</h2>
          <p className="mt-1 text-sm text-stone-500">
            เพื่อนส่งสลิป เจ้าของเห็นแจ้งเตือนและตัวเลขบนเมนูทันที
            พอเจ้าของกดอนุมัติ หน้าของเพื่อนก็เปลี่ยนเป็น “โอนแล้ว” เอง ไม่ต้องรีเฟรช
          </p>
        </div>
      </section>

      {/* ทำอะไรได้บ้าง */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-700">ทำอะไรได้บ้าง</h2>
        <ul className="grid grid-cols-2 gap-3">
          {features.map((f) => {
            const soon = "soon" in f && f.soon;
            const beta = "beta" in f && f.beta;
            return (
              <li
                key={f.title}
                className={cn(
                  "flex flex-col gap-2 rounded-2xl border border-stone-200 bg-card p-4",
                  soon && "border-dashed bg-card/60",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-9 items-center justify-center rounded-full bg-stone-100 text-stone-700">
                    <f.icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  {beta && <BetaBadge />}
                  {soon && (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] leading-none font-bold text-stone-500">
                      เร็วๆ นี้
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{f.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* บิลล่าสุด */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-stone-700">บิลล่าสุด</h2>
          <Link href="/bills" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>
        <RecentBills />
      </section>
    </main>
  );
}
