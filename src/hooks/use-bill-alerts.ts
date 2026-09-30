"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePersistedString } from "@/hooks/use-persisted-string";
import { billTopic, SLIP_EVENT, type SlipPayload } from "@/lib/bill-channel";
import { emitBillsChanged, onBillsChanged } from "@/lib/bill-events";
import { parseRecent, RECENT_KEY } from "@/lib/recent-bills";
import { supabase } from "@/lib/supabase";

const POLL_MS = 45_000;

/**
 * จำนวนสลิปที่รอเจ้าของบิลตรวจ (รวมทุกบิลที่สร้างจากเครื่องนี้) + แจ้งเตือนแบบ realtime
 *
 * 2 ชั้น:
 * 1) Realtime: subscribe Broadcast ของทุกบิล — เพื่อนส่งสลิป → toast ทันที
 * 2) สำรอง: นับใหม่ตอนเปิดแอป / กลับมาที่แท็บ / กลับมาออนไลน์ / ทุก 45 วินาที
 *    (ใช้ได้แม้ยังไม่ได้ตั้งคีย์ Realtime หรือ WebSocket หลุด)
 */
export function useBillAlerts(): number {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const [raw] = usePersistedString(RECENT_KEY);
  const tokensKey = useMemo(() => parseRecent(raw).map((b) => b.adminToken).join(","), [raw]);
  const [pending, setPending] = useState(0);

  // ชั้นสำรอง: ถามจำนวนสลิปรอตรวจจากเซิร์ฟเวอร์
  useEffect(() => {
    if (!tokensKey) return;
    const ac = new AbortController();
    const load = () =>
      fetch("/api/bills/summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tokens: tokensKey.split(",") }),
        signal: ac.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { bills?: { pendingSlips: number }[] } | null) => {
          if (d?.bills) setPending(d.bills.reduce((s, b) => s + b.pendingSlips, 0));
        })
        .catch(() => {});

    void load();
    const onVisible = () => document.visibilityState === "visible" && void load();
    const id = setInterval(() => document.visibilityState === "visible" && void load(), POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", load);
    const off = onBillsChanged(() => void load());
    return () => {
      ac.abort();
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", load);
      off();
    };
  }, [tokensKey]);

  // Realtime: ฟังสัญญาณสลิปใหม่ของแต่ละบิล
  useEffect(() => {
    const client = supabase;
    if (!client || !tokensKey) return;
    let cancelled = false;
    const channels: ReturnType<typeof client.channel>[] = [];

    (async () => {
      for (const token of tokensKey.split(",")) {
        const topic = await billTopic(token);
        if (cancelled) return;
        const channel = client
          .channel(topic)
          .on("broadcast", { event: SLIP_EVENT }, ({ payload }) => {
            const { name, title } = payload as SlipPayload;
            const here = pathRef.current.startsWith(`/manage/${token}`);
            toast.warning(`${name} ส่งสลิปแล้ว`, {
              description: title,
              duration: 8000,
              action: here ? undefined : { label: "ตรวจสลิป", onClick: () => router.push(`/manage/${token}`) },
            });
            if (here) router.refresh(); // กำลังเปิดบิลนี้อยู่ → อัปเดตหน้าให้เลย
            emitBillsChanged(); // ให้ badge และหน้ารายการบิลนับใหม่
          })
          .subscribe();
        channels.push(channel);
      }
    })();

    return () => {
      cancelled = true;
      channels.forEach((c) => void client.removeChannel(c));
    };
  }, [tokensKey, router]);

  return tokensKey ? pending : 0;
}
