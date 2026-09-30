"use client";
import { Moon, Sun } from "lucide-react";
import { setTheme, useTheme } from "@/hooks/use-theme";

/** ปุ่มสลับ light / dark */
export function ThemeToggle() {
  const dark = useTheme() === "dark";

  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
      className="relative flex size-11 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-card text-stone-700 transition hover:bg-stone-100 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <Sun
        aria-hidden="true"
        className={`absolute size-5 transition duration-300 ${dark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"}`}
      />
      <Moon
        aria-hidden="true"
        className={`absolute size-5 transition duration-300 ${dark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
      />
    </button>
  );
}
