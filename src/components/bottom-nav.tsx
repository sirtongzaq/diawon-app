"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "หน้าแรก", icon: Home },
  { href: "/bill", label: "บิล", icon: Receipt },
] as const;

/** เมนูล่างแบบกระจกโปร่งใส — แถบสี coral เลื่อนตามแท็บที่เลือก */
export function BottomNav() {
  const pathname = usePathname();
  const active = tabs.findIndex(({ href }) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href),
  );

  return (
    <nav
      aria-label="เมนูหลัก"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <ul className="pointer-events-auto relative flex w-full max-w-xs items-center rounded-full border border-stone-200/60 bg-card/50 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.14)] backdrop-blur-xl backdrop-saturate-150">
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
        {tabs.map(({ href, label, icon: Icon }, i) => (
          <li key={href} className="relative z-10 flex-1">
            <Link
              href={href}
              aria-current={i === active ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors duration-300",
                i === active ? "text-on-brand" : "text-stone-600 hover:text-ink",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
