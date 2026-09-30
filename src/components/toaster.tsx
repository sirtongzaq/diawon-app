"use client";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/hooks/use-theme";

/** Toast กลางแอป — สีตามธีมของแอป (ไม่ใช่ prefers-color-scheme ของระบบ) */
export function Toaster() {
  const theme = useTheme();
  return (
    <Sonner
      theme={theme}
      position="top-center"
      offset={16}
      mobileOffset={12}
      duration={3500}
      closeButton
      style={
        {
          "--normal-bg": "var(--color-card)",
          "--normal-text": "var(--color-ink)",
          "--normal-border": "var(--color-stone-200)",
          "--success-bg": "var(--color-card)",
          "--success-text": "var(--color-ink)",
          "--success-border": "var(--color-stone-200)",
          "--error-bg": "var(--color-rose-50)",
          "--error-text": "var(--color-rose-700)",
          "--error-border": "var(--color-rose-600)",
          "--warning-bg": "var(--color-amber-50)",
          "--warning-text": "var(--color-amber-800)",
          "--warning-border": "var(--color-amber-200)",
          "--border-radius": "1rem",
          fontFamily: "var(--font-sans)",
        } as React.CSSProperties
      }
    />
  );
}
