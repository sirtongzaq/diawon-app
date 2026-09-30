"use client";
import { useEffect, useState } from "react";
import { promptPayQrDataUrl } from "@/lib/promptpay";

/** QR PromptPay แบบ inline (พื้นขาวเสมอ เพื่อให้แอปธนาคารสแกนติด) */
export function PayQr({ promptPayId, amount, name }: { promptPayId: string; amount: number; name: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    promptPayQrDataUrl(promptPayId, amount).then((u) => alive && setSrc(u));
    return () => {
      alive = false;
    };
  }, [promptPayId, amount]);

  return (
    <div className="mx-auto flex aspect-square w-64 items-center justify-center rounded-2xl border border-stone-200 bg-white p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={`QR PromptPay ของ ${name}`} className="size-full rounded-lg bg-white" /> : <span className="text-sm text-stone-500">กำลังสร้าง QR…</span>}
    </div>
  );
}
