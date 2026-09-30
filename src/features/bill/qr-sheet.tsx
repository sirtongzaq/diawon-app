"use client";
import { useEffect, useState } from "react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatBaht } from "@/lib/utils";
import { promptPayQrDataUrl } from "@/lib/promptpay";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  amount: number; // สตางค์
  promptPayId: string;
};

export function QrSheet({ open, onOpenChange, name, amount, promptPayId }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    promptPayQrDataUrl(promptPayId, amount).then((u) => alive && setSrc(u));
    return () => {
      alive = false;
      setSrc(null);
    };
  }, [open, promptPayId, amount]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="text-center">
        <SheetDescription className="text-sm text-stone-500">โอนให้เจ้าของบิล</SheetDescription>
        <SheetTitle className="mt-1 text-lg font-bold">{name}</SheetTitle>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">฿{formatBaht(amount)}</p>
        <div className="mx-auto mt-5 flex aspect-square w-64 items-center justify-center rounded-2xl border border-stone-200 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src ? <img src={src} alt={`QR PromptPay ของ ${name}`} className="size-full rounded-lg bg-white" /> : <span className="text-sm text-stone-400">กำลังสร้าง QR…</span>}
        </div>
        <SheetClose asChild>
          <Button variant="ghost" className="mt-6 w-full">เสร็จแล้ว</Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
