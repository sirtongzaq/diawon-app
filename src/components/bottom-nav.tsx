"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Plus } from "lucide-react";
import { useBillAlerts } from "@/hooks/use-bill-alerts";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "หน้าแรก", icon: Home, match: ["/"] },
  { href: "/bill", label: "สร้างบิล", icon: Plus, match: ["/bill"] },
  { href: "/bills", label: "รายการ", icon: ListChecks, match: ["/bills", "/manage"] },
] as const;

/** ตรงเป๊ะหรืออยู่ใต้ path นั้น (กัน /bill ไปชน /bills) */
const matches = (pathname: string, base: string) =>
  base === "/" ? pathname === "/" : pathname === base || pathname.startsWith(`${base}/`);

/** เมนูล่างแบบกระจกโปร่งใส — แถบสี coral เลื่อนตามแท็บที่เลือก + badge สลิปรอตรวจ */
export function BottomNav() {
  const pathname = usePathname();
  const pending = useBillAlerts();
  const active = tabs.findIndex((t) => t.match.some((m) => matches(pathname, m)));

  return (
    <nav
      aria-label="เมนูหลัก"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <ul className="pointer-events-auto relative flex w-full max-w-sm items-center rounded-full border border-stone-200/60 bg-card/50 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.14)] backdrop-blur-xl backdrop-saturate-150">
        {/* แถบที่เลื่อน: กว้างเท่าแท็บเดียว เลื่อนด้วย translateX ตาม index */}
        {active >= 0 && (
          <span
            aria-hidden="true"
            className="absolute inset-y-1.5 left-1.5 rounded-full bg-brand shadow-sm shadow-brand/40 transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              width: `calc((100% - 0.75rem) / ${tabs.length})`,
              transform: `translateX(${active * 100}%)`,
            }}
          />
        )}
        {tabs.map(({ href, label, icon: Icon }, i) => {
          const badge = href === "/bills" ? pending : 0;
          return (
            <li key={href} className="relative z-10 flex-1">
              <Link
                href={href}
                aria-current={i === active ? "page" : undefined}
                aria-label={badge ? `รายการบิล มีสลิปรอตรวจ ${badge} รายการ` : href === "/bills" ? "รายการบิล" : undefined}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-colors duration-300",
                  i === active ? "text-on-brand" : "text-stone-600 hover:text-ink",
                  badge > 0 && "pr-6", // เว้นที่ให้ badge ชิดขวา ไม่ทับข้อความ
                )}
              >
                <Icon className="size-[18px]" aria-hidden="true" />
                {label}
              </Link>
              {badge > 0 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-2 flex h-[18px] min-w-[18px] -translate-y-1/2 animate-pop-in items-center justify-center rounded-full bg-ink px-1 text-[10px] leading-none font-bold text-page"
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
