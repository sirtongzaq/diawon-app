"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CircleCheck, ImagePlus, Plus, RefreshCw, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { readReceiptText, type OcrProgress } from "@/lib/ocr";
import { parseReceipt, type ParsedReceipt, type ScannedItem } from "@/lib/receipt-parse";
import { formatBaht, parseBaht, sanitizeAmount, uid } from "@/lib/utils";
import { BetaBadge } from "./beta-badge";

export type ScanMeta = { servicePct: number | null; vatPct: number | null };

type Row = { id: string; name: string; price: string };
type Phase = "pick" | "reading" | "review";

const statusText = (status: string) => {
  if (status.includes("language")) return "กำลังโหลดข้อมูลภาษาไทย (ครั้งแรกอาจใช้เวลาสักครู่)…";
  if (status.includes("recogniz")) return "กำลังอ่านข้อความในรูป…";
  return "กำลังเตรียมตัวอ่านภาพ…";
};

/** สแกนใบเสร็จ: เลือกรูป → OCR → ตรวจแก้รายการ → เติมลงบิล */
export function ReceiptScan({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (items: ScannedItem[], meta: ScanMeta) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<Phase>("pick");
  const [progress, setProgress] = useState<OcrProgress>({ status: "", progress: 0 });
  const [preview, setPreview] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [rawText, setRawText] = useState("");

  // คืน object URL ตอนออกจากหน้า
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function reset() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setPreview(null);
    setPhase("pick");
    setRows([]);
    setParsed(null);
    setRawText("");
    setProgress({ status: "", progress: 0 });
    if (inputRef.current) inputRef.current.value = "";
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("เลือกได้เฉพาะไฟล์รูปภาพ");

    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(file);
    setPreview(urlRef.current);
    setPhase("reading");
    setProgress({ status: "", progress: 0 });

    try {
      const text = await readReceiptText(file, setProgress);
      const result = parseReceipt(text);
      setRawText(text);
      setParsed(result);
      setRows(result.items.map((i) => ({ id: uid(), name: i.name, price: String(i.priceSatang / 100) })));
      setPhase("review");
      if (result.items.length === 0) toast.warning("อ่านรายการจากรูปนี้ไม่ได้ ลองถ่ายใหม่ หรือเพิ่มเองด้านล่าง");
      else toast.success(`อ่านได้ ${result.items.length} รายการ · ตรวจความถูกต้องก่อนเพิ่มนะ`);
    } catch (e) {
      console.error("ocr failed", e);
      toast.error("สแกนไม่สำเร็จ ลองเลือกรูปใหม่อีกครั้ง");
      reset();
    }
  }

  const valid = useMemo(
    () => rows.filter((r) => r.name.trim() && parseBaht(r.price) > 0),
    [rows],
  );
  const sum = valid.reduce((s, r) => s + parseBaht(r.price), 0);

  // เทียบผลรวมรายการกับยอดในใบเสร็จ (ก่อนค่าบริการ/VAT)
  const reference = parsed
    ? (parsed.subtotalSatang ?? (parsed.servicePct == null && parsed.vatPct == null ? parsed.totalSatang : null))
    : null;
  const matches = reference != null && reference === sum;

  const patch = (id: string, p: Partial<Row>) => setRows((v) => v.map((r) => (r.id === id ? { ...r, ...p } : r)));

  function apply() {
    onApply(
      valid.map((r) => ({ name: r.name.trim().slice(0, 40), priceSatang: parseBaht(r.price) })),
      { servicePct: parsed?.servicePct ?? null, vatPct: parsed?.vatPct ?? null },
    );
    toast.success(`เติม ${valid.length} รายการจากใบเสร็จแล้ว`);
    onOpenChange(false);
    reset();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && phase === "reading") return; // กำลังอ่านอยู่ ไม่ให้ปิดกลางคัน
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <SheetContent>
        <SheetTitle className="flex items-center gap-2 text-lg font-bold">
          สแกนใบเสร็จ
          <BetaBadge />
        </SheetTitle>
        <SheetDescription className="mt-0.5 text-sm text-stone-500">
          อ่านด้วย OCR ในเครื่องคุณ ไม่ส่งรูปออกไปไหน · ผลอาจคลาดเคลื่อน ตรวจก่อนเพิ่มทุกครั้ง
        </SheetDescription>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="เลือกรูปใบเสร็จ"
          onChange={(e) => pick(e.target.files?.[0])}
        />

        {phase === "pick" && (
          <div className="mt-5 flex flex-col gap-3">
            <Button variant="ghost" size="lg" className="w-full border-dashed" onClick={() => inputRef.current?.click()}>
              <ImagePlus className="size-5" aria-hidden="true" />
              ถ่ายรูป / เลือกรูปใบเสร็จ
            </Button>
            <ul className="list-disc space-y-1 pl-5 text-xs text-stone-500">
              <li>ถ่ายให้ใบเสร็จอยู่ตรงๆ เต็มเฟรม แสงสว่างพอ ไม่เงาสะท้อน</li>
              <li>ใบเสร็จยาวให้ถ่ายเฉพาะส่วนรายการอาหาร</li>
              <li>ใบเสร็จตัวจางมาก อาจอ่านไม่ออก ให้เพิ่มรายการเองแทน</li>
            </ul>
          </div>
        )}

        {phase === "reading" && (
          <div className="mt-5 flex flex-col items-center gap-4 py-2" role="status">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview && <img src={preview} alt="ใบเสร็จที่เลือก" className="max-h-40 rounded-xl border border-stone-200 object-contain" />}
            <p className="text-sm font-medium">{statusText(progress.status)}</p>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-stone-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress.progress * 100)}
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300"
                style={{ width: `${Math.max(6, Math.round(progress.progress * 100))}%` }}
              />
            </div>
          </div>
        )}

        {phase === "review" && (
          <div className="mt-5 flex flex-col gap-4">
            {(parsed?.servicePct != null || parsed?.vatPct != null) && (
              <p className="text-xs text-stone-500">
                พบในใบเสร็จ:
                {parsed?.servicePct != null && ` Service ${parsed.servicePct}%`}
                {parsed?.servicePct != null && parsed?.vatPct != null && " ·"}
                {parsed?.vatPct != null && ` VAT ${parsed.vatPct}%`}
                <span className="text-stone-400"> (จะตั้งสวิตช์ให้ตามนี้)</span>
              </p>
            )}

            <ul className="flex flex-col gap-2">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  <Input
                    aria-label="ชื่อรายการ"
                    maxLength={40}
                    value={r.name}
                    onChange={(e) => patch(r.id, { name: e.target.value })}
                  />
                  <Input
                    aria-label="ราคา (บาท)"
                    inputMode="decimal"
                    className="w-24 shrink-0"
                    value={r.price}
                    aria-invalid={!!r.name.trim() && parseBaht(r.price) <= 0}
                    onChange={(e) => patch(r.id, { price: sanitizeAmount(e.target.value) })}
                  />
                  <button
                    onClick={() => setRows((v) => v.filter((x) => x.id !== r.id))}
                    aria-label={`ลบ ${r.name || "แถวนี้"}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-ink"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
              {rows.length === 0 && <li className="text-sm text-stone-500">ยังไม่มีรายการ กด “เพิ่มแถว” เพื่อกรอกเอง</li>}
            </ul>

            <Button variant="link" className="self-start" onClick={() => setRows((v) => [...v, { id: uid(), name: "", price: "" }])}>
              <Plus className="size-4" aria-hidden="true" />
              เพิ่มแถว
            </Button>

            {/* เช็กผลรวมกับใบเสร็จ */}
            {reference != null && (
              <p
                role="status"
                className={
                  matches
                    ? "flex items-start gap-2 rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-700"
                    : "flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                }
              >
                {matches ? (
                  <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {matches
                    ? `ผลรวมรายการ ฿${formatBaht(sum)} ตรงกับใบเสร็จ`
                    : `ผลรวมรายการ ฿${formatBaht(sum)} ไม่ตรงกับใบเสร็จ ฿${formatBaht(reference)} · ตรวจรายการที่อ่านผิดหรือตกหล่น`}
                </span>
              </p>
            )}

            <details className="text-xs text-stone-500">
              <summary className="cursor-pointer">ดูข้อความดิบที่อ่านได้</summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-stone-50 p-3 whitespace-pre-wrap">{rawText || "(ว่าง)"}</pre>
            </details>

            <div className="flex flex-col gap-2">
              <Button size="lg" disabled={valid.length === 0} onClick={apply}>
                เพิ่ม {valid.length} รายการลงบิล · ฿{formatBaht(sum)}
              </Button>
              <Button variant="ghost" onClick={reset}>
                <RefreshCw className="size-4" aria-hidden="true" />
                สแกนรูปใหม่
              </Button>
            </div>
          </div>
        )}

        {phase !== "review" && phase !== "reading" && (
          <SheetClose asChild>
            <Button variant="link" className="mt-3 w-full">ปิด</Button>
          </SheetClose>
        )}
      </SheetContent>
    </Sheet>
  );
}
