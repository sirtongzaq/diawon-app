"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PAID_EVENT, personTopic, REJECT_EVENT, type PaidPayload } from "@/lib/bill-channel";
import { supabase } from "@/lib/supabase";

const POLL_MS = 15_000;

/**
 * หน้าเพื่อน: อัปเดตสถานะแบบ realtime เมื่อเจ้าของบิลอนุมัติ / ไม่อนุมัติสลิป (ไม่ต้องรีเฟรชเอง)
 * ไม่มี UI ของตัวเอง — ฟังสัญญาณแล้วสั่ง router.refresh() ให้หน้า server render ใหม่
 *
 * ชั้นสำรอง: ระหว่างที่ยังไม่โอนสำเร็จ จะรีเฟรชทุก 15 วินาที และตอนกลับมาที่แท็บ
 * (ใช้ได้แม้ realtime ไม่ทำงาน)
 */
export function LiveStatus({ token, paid }: { token: string; paid: boolean }) {
  const router = useRouter();

  // สถานะเปลี่ยนเป็น "จ่ายแล้ว" ไม่ว่าจะรู้จาก realtime หรือ polling → แจ้งครั้งเดียว (id เดียวกัน = ไม่ซ้ำ)
  const wasPaid = useRef(paid);
  useEffect(() => {
    if (paid && !wasPaid.current) {
      toast.success("เจ้าของบิลยืนยันการโอนแล้ว ขอบคุณนะ", { id: "paid-status", duration: 6000 });
    }
    wasPaid.current = paid;
  }, [paid]);

  // Realtime
  useEffect(() => {
    const client = supabase;
    if (!client || paid) return;
    let cancelled = false;
    let channel: ReturnType<typeof client.channel> | null = null;

    personTopic(token).then((topic) => {
      if (cancelled) return;
      channel = client
        .channel(topic)
        .on("broadcast", { event: PAID_EVENT }, ({ payload }) => {
          if ((payload as PaidPayload).paid) {
            toast.success("เจ้าของบิลยืนยันการโอนแล้ว ขอบคุณนะ", { id: "paid-status", duration: 6000 });
          }
          router.refresh();
        })
        .on("broadcast", { event: REJECT_EVENT }, () => {
          toast.warning("เจ้าของบิลไม่อนุมัติสลิปนี้ ลองส่งสลิปใหม่อีกครั้งนะ", { id: "slip-rejected", duration: 8000 });
          router.refresh();
        })
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) void client.removeChannel(channel);
    };
  }, [token, paid, router]);

  // ชั้นสำรอง: polling + กลับมาที่แท็บ
  useEffect(() => {
    if (paid) return;
    const refresh = () => document.visibilityState === "visible" && router.refresh();
    const id = setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [paid, router]);

  return null;
}
