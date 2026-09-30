"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ImagePlus, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image-compress";

const MAX_BYTES = 4 * 1024 * 1024;

/** เพื่อนแนบสลิปหลังโอน: เลือกรูป → ดูตัวอย่าง → ส่ง (เจ้าของบิลจะเป็นคนอนุมัติ) */
export function SlipUpload({ token, pending, uploadedAt }: { token: string; pending: boolean; uploadedAt: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const file = picked?.file ?? null;
  const preview = picked?.url ?? null;

  // คืน object URL ตอนออกจากหน้า
  const urlRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  function setFile(f: File | null) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = f ? URL.createObjectURL(f) : null;
    setPicked(f && urlRef.current ? { file: f, url: urlRef.current } : null);
  }

  async function pick(f: File | undefined) {
    if (!f) return;
    setError(null);
    if (!f.type.startsWith("image/")) return setError("เลือกได้เฉพาะไฟล์รูปภาพ");
    setBusy(true);
    const small = await compressImage(f);
    setBusy(false);
    if (small.size > MAX_BYTES) return setError("รูปใหญ่เกินไป (ไม่เกิน 4 MB) ลองแคปหน้าจอสลิปแทนนะ");
    setFile(small);
  }

  function reset() {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function send() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/p/${token}/slip`, { method: "POST", body });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "ส่งสลิปไม่สำเร็จ");
      reset();
      setReplacing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งสลิปไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const showPicker = !pending || replacing;
  const when = uploadedAt
    ? new Date(uploadedAt).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-stone-700">โอนแล้ว? แนบสลิปเพื่อยืนยัน</h2>

      {pending && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <Clock className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold">ส่งสลิปแล้ว รอเจ้าของบิลยืนยัน</p>
            {when && <p className="mt-0.5 opacity-80">ส่งเมื่อ {when}</p>}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="เลือกรูปสลิป"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {showPicker && !file && (
        <Button variant="ghost" size="lg" className="w-full border-dashed" disabled={busy} onClick={() => inputRef.current?.click()}>
          <ImagePlus className="size-5" aria-hidden="true" />
          {busy ? "กำลังเตรียมรูป…" : "เลือกรูปสลิป"}
        </Button>
      )}

      {file && preview && (
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="ตัวอย่างสลิปที่เลือก" className="mx-auto max-h-96 rounded-2xl border border-stone-200 object-contain" />
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" disabled={busy} onClick={reset}>เลือกใหม่</Button>
            <Button className="flex-1" disabled={busy} onClick={send}>
              <Send className="size-4" aria-hidden="true" />
              {busy ? "กำลังส่ง…" : "ส่งสลิป"}
            </Button>
          </div>
        </div>
      )}

      {pending && !replacing && !file && (
        <Button variant="link" className="self-center" onClick={() => setReplacing(true)}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          ส่งสลิปใหม่
        </Button>
      )}

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
    </section>
  );
}
