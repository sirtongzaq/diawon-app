"use client";
import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "diawon:theme";

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export function setTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {}
  listeners.forEach((l) => l());
}

/** ธีมปัจจุบัน (ค่าเริ่มต้นตั้งโดยสคริปต์ใน <head> กันจอวาบ) */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);
}
