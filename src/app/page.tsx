import Link from "next/link";
import { ArrowRight, BellRing, QrCode, Receipt } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RecentBills } from "@/features/bill/recent-bills";
import { cn } from "@/lib/utils";

const steps = [
  { icon: Receipt, title: "ใส่รายการ", desc: "เลือกว่าใครกินอะไร" },
  { icon: QrCode, title: "ได้ QR รายคน", desc: "PromptPay พร้อมยอด" },
  { icon: BellRing, title: "ระบบเตือนแทน", desc: "ไม่ต้องทวงเอง" },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-4 pb-32">
      {/* Hero (dump) */}
      <section className="rounded-3xl bg-accent p-6 text-white">
        <p className="text-sm text-white/70">สวัสดี 👋</p>
        <h1 className="mt-1 text-2xl leading-snug font-extrabold tracking-tight">
          หารบิลกับเพื่อน
          <br />
          แบบไม่อึดอัด
        </h1>
        <Link
          href="/bill"
          className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-5 w-full")}
        >
          สร้างบิลใหม่
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </section>

      {/* ทำงานยังไง (dump) */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-700">ทำงานยังไง</h2>
        <ul className="grid grid-cols-3 gap-2">
          {steps.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="rounded-2xl border border-stone-200 bg-card p-3 text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand/20 text-brand">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-2 text-xs font-semibold">{title}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-stone-500">{desc}</p>
            </li>
          ))}
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
