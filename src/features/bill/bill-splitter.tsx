"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn, formatBaht, parseBaht, sanitizeAmount, uid } from "@/lib/utils";
import { addRecent, RECENT_KEY } from "@/lib/recent-bills";
import { computeSplit, type Item, type Person } from "@/lib/split";
import { isValidThaiPhone } from "@/lib/promptpay";
import { usePersistedString } from "@/hooks/use-persisted-string";
import type { ScannedItem } from "@/lib/receipt-parse";
import { QrSheet } from "./qr-sheet";
import { BetaBadge } from "./beta-badge";
import { ReceiptScan, type ScanMeta } from "./receipt-scan";
import { SuggestChips } from "./suggest-chips";
import { BILL_TITLE_SUGGESTIONS, ITEM_SUGGESTIONS } from "./suggestions";

const PP_KEY = "diawon:promptpay";

const label = "text-xs font-medium text-stone-500";
const iconBtn =
  "flex size-6 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-ink";

/** การ์ดหนึ่งขั้นตอน: เลขขั้น + หัวข้อ + คำอธิบายสั้น + เนื้อหา */
function StepCard({
  step,
  title,
  hint,
  aside,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <header className="mb-4 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-on-brand"
        >
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base leading-tight font-bold">{title}</h2>
          {hint && <p className="text-xs text-stone-500">{hint}</p>}
        </div>
        {aside}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function BillSplitter() {
  const [promptPayId, setPromptPayId] = usePersistedString(PP_KEY);
  const [people, setPeople] = useState<Person[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [service, setService] = useState(true);
  const [vat, setVat] = useState(true);
  const [personName, setPersonName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [qrFor, setQrFor] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recentRaw, setRecentRaw] = usePersistedString(RECENT_KEY);
  const router = useRouter();

  const result = useMemo(
    () => computeSplit(people, items, { servicePct: service ? 10 : 0, vatPct: vat ? 7 : 0 }),
    [people, items, service, vat],
  );
  const ppOk = isValidThaiPhone(promptPayId);
  // ไม่เตือนแดงระหว่างพิมพ์ยังไม่ครบ; เตือนเมื่อออกจากช่อง หรือพิมพ์ครบ 10 หลักแล้วยังผิด
  const phoneError = ppOk
    ? null
    : promptPayId === ""
      ? phoneTouched
        ? "กรอกเบอร์ PromptPay ของคุณ"
        : null
      : phoneTouched || promptPayId.length >= 10
        ? "เบอร์ไม่ถูกต้อง ต้องเป็นเลข 10 หลัก ขึ้นต้นด้วย 0"
        : null;
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "";

  function addPerson() {
    const name = personName.trim();
    if (!name) return;
    if (people.some((p) => p.name === name)) return void toast.error(`มี “${name}” อยู่แล้ว ลองเติมนามสกุลหรือเลขต่อท้าย`);
    setPeople((v) => [...v, { id: uid(), name }]);
    setPersonName("");
  }
  function removePerson(id: string) {
    setPeople((v) => v.filter((p) => p.id !== id));
    setItems((v) => v.map((i) => ({ ...i, people: i.people.filter((x) => x !== id) })));
  }
  function addItem() {
    const price = parseBaht(itemPrice);
    const name = itemName.trim();
    if (!name) return setItemError("ใส่ชื่อรายการก่อน");
    if (!price) return setItemError("ราคาต้องเป็นตัวเลขมากกว่า 0");
    setItemError(null);
    toast.success(`เพิ่ม “${name}” แล้ว`, { duration: 1500 });
    // เริ่มต้นให้ทุกคนหารเท่ากัน แล้วค่อยแตะปิดคนที่ไม่กิน
    setItems((v) => [...v, { id: uid(), name, price, people: people.map((p) => p.id) }]);
    setItemName("");
    setItemPrice("");
  }
  /** รายการที่สแกน+ตรวจแก้แล้ว → เติมลงบิล (ทุกคนหารเท่ากันก่อน แล้วแตะปิดคนที่ไม่กิน) */
  function applyScanned(scanned: ScannedItem[], meta: ScanMeta) {
    const everyone = people.map((p) => p.id);
    setItems((v) => [
      ...v,
      ...scanned.map((s) => ({ id: uid(), name: s.name, price: s.priceSatang, people: everyone })),
    ]);
    if (meta.servicePct != null) setService(meta.servicePct > 0);
    if (meta.vatPct != null) setVat(meta.vatPct > 0);
  }
  function toggle(itemId: string, personId: string) {
    setItems((v) =>
      v.map((i) =>
        i.id !== itemId
          ? i
          : { ...i, people: i.people.includes(personId) ? i.people.filter((x) => x !== personId) : [...i.people, personId] },
      ),
    );
  }

  const qrShare = result.shares.find((s) => s.personId === qrFor);
  const canSave = ppOk && people.length > 0 && items.length > 0 && result.unassigned.length === 0;

  /** ส่งบิลให้เซิร์ฟเวอร์บันทึก (ยอดจริงคำนวณซ้ำฝั่งเซิร์ฟเวอร์) แล้วไปหน้าจัดการบิล */
  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          promptPayId,
          servicePct: service ? 10 : 0,
          vatPct: vat ? 7 : 0,
          people: people.map((p) => ({ name: p.name })),
          items: items.map((i) => ({
            name: i.name,
            priceSatang: i.price,
            people: i.people.map((id) => people.findIndex((p) => p.id === id)),
          })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "บันทึกบิลไม่สำเร็จ");
      setRecentRaw(
        addRecent(recentRaw, {
          adminToken: data.adminToken,
          title: title.trim() || "บิลมื้อนี้",
          total: data.total,
          count: people.length,
          createdAt: Date.now(),
        }),
      );
      toast.success("บันทึกบิลแล้ว · ส่งลิงก์ให้เพื่อนได้เลย");
      router.push(`/manage/${data.adminToken}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "บันทึกบิลไม่สำเร็จ";
      setSaveError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-5 pt-2 pb-32">
      <div className="px-1 pb-1">
        <h1 className="text-2xl font-extrabold tracking-tight">สร้างบิล</h1>
        <p className="text-sm text-stone-500">หารบิลกับเพื่อน ไม่ต้องทวงเอง</p>
      </div>

      {/* 1) ข้อมูลบิล */}
      <StepCard step={1} title="ข้อมูลบิล" hint="ตั้งชื่อ และเบอร์ที่จะให้เพื่อนโอนมา">
        <div className="flex flex-col gap-2">
          <label htmlFor="bill-title" className={label}>ชื่อบิล</label>
          <Input
            id="bill-title"
            maxLength={60}
            placeholder="เช่น หมูกระทะวันศุกร์"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <SuggestChips
            scroll
            label="ชื่อบิลที่แนะนำ"
            options={BILL_TITLE_SUGGESTIONS}
            selected={title}
            onPick={setTitle}
            onClear={() => setTitle("")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="pp-phone" className={label}>เบอร์ PromptPay ของคุณ</label>
          <Input
            id="pp-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            placeholder="0812345678"
            value={promptPayId}
            onChange={(e) => setPromptPayId(e.target.value.replace(/\D/g, "").slice(0, 10))}
            onBlur={() => setPhoneTouched(true)}
            aria-invalid={!!phoneError}
            aria-describedby="pp-hint"
          />
          {phoneError ? (
            <p id="pp-hint" role="alert" className="text-xs font-medium text-rose-600">{phoneError}</p>
          ) : (
            <p id="pp-hint" className="text-xs text-stone-400">เก็บไว้ในเครื่องนี้เท่านั้น</p>
          )}
        </div>
      </StepCard>

      {/* 2) เพื่อน */}
      <StepCard step={2} title="ใครมาบ้าง" hint={people.length ? `${people.length} คน` : "เพิ่มชื่อเพื่อนที่ร่วมหาร"}>
        <form className="flex gap-2" onSubmit={(e) => (e.preventDefault(), addPerson())}>
          <Input aria-label="ชื่อเพื่อน" maxLength={20} placeholder="ชื่อเพื่อน" value={personName} onChange={(e) => setPersonName(e.target.value)} />
          <Button type="submit" size="icon" aria-label="เพิ่มเพื่อน"><Plus className="size-4" /></Button>
        </form>
        {people.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-0.5 rounded-full bg-stone-100 py-1 pr-1 pl-3 text-sm font-medium">
                {p.name}
                <button onClick={() => removePerson(p.id)} aria-label={`ลบ ${p.name}`} className={iconBtn}>
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </StepCard>

      {/* 3) รายการ + ค่าบริการ/VAT */}
      <StepCard step={3} title="รายการ" hint={items.length ? `${items.length} รายการ` : "เพิ่มอาหาร/ของที่สั่ง แล้วเลือกว่าใครกิน"}>
        <div className="flex flex-col gap-1.5">
          <Button variant="ghost" className="w-full" disabled={people.length === 0} onClick={() => setScanOpen(true)}>
            <ScanLine className="size-4" aria-hidden="true" />
            สแกนใบเสร็จ
            <BetaBadge />
          </Button>
          {people.length === 0 && <p className="text-center text-xs text-stone-400">เพิ่มเพื่อนในขั้นที่ 2 ก่อน ถึงจะสแกนได้</p>}
        </div>

        <div className="flex flex-col gap-2">
          <form className="flex gap-2" onSubmit={(e) => (e.preventDefault(), addItem())}>
            <Input
              aria-label="ชื่อรายการ"
              maxLength={40}
              placeholder="ผัดไทย"
              value={itemName}
              onChange={(e) => (setItemName(e.target.value), setItemError(null))}
            />
            <Input
              ref={priceRef}
              inputMode="decimal"
              placeholder="฿ ราคา"
              aria-label="ราคา (บาท)"
              aria-invalid={itemError?.startsWith("ราคา")}
              className="w-24 shrink-0"
              value={itemPrice}
              onChange={(e) => (setItemPrice(sanitizeAmount(e.target.value)), setItemError(null))}
            />
            <Button type="submit" size="icon" aria-label="เพิ่มรายการ" disabled={people.length === 0}>
              <Plus className="size-4" />
            </Button>
          </form>
          {itemError && <p role="alert" className="text-xs font-medium text-rose-600">{itemError}</p>}
          {people.length === 0 && <p className="text-xs text-stone-400">เพิ่มเพื่อนในขั้นที่ 2 ก่อน ถึงจะเพิ่มรายการได้</p>}
          <SuggestChips
            scroll
            label="รายการที่แนะนำ"
            options={ITEM_SUGGESTIONS}
            selected={itemName}
            onPick={(v) => {
              setItemName(v);
              setItemError(null);
              priceRef.current?.focus();
            }}
            onClear={() => setItemName("")}
          />
        </div>

        {items.length > 0 && (
          <ul className="flex flex-col gap-2">
            {items.map((i) => (
              <li key={i.id} className="rounded-2xl bg-stone-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{i.name}</span>
                  <span className="flex items-center gap-1 text-sm font-semibold">
                    ฿{formatBaht(i.price)}
                    <button onClick={() => setItems((v) => v.filter((x) => x.id !== i.id))} aria-label={`ลบ ${i.name}`} className={iconBtn}>
                      <X className="size-3.5" />
                    </button>
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {people.map((p) => {
                    const on = i.people.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggle(i.id, p.id)}
                        aria-pressed={on}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition",
                          on ? "border-accent bg-accent text-white" : "border-stone-200 bg-card text-stone-500 hover:bg-stone-100",
                        )}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
                {i.people.length === 0 && <p className="mt-2 text-xs text-rose-600">ยังไม่ได้เลือกคนกิน</p>}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-3 border-t border-stone-200 pt-4">
          {[
            { id: "svc", label: "Service charge 10%", checked: service, set: setService },
            { id: "vat", label: "VAT 7%", checked: vat, set: setVat },
          ].map((r) => (
            <div key={r.id} className="flex items-center justify-between">
              <label htmlFor={r.id} className="text-sm text-stone-700">{r.label}</label>
              <Switch id={r.id} checked={r.checked} onCheckedChange={r.set} />
            </div>
          ))}
        </div>
      </StepCard>

      {/* 4) สรุป */}
      {people.length > 0 && items.length > 0 && (
        <StepCard
          step={4}
          title="ใครโอนเท่าไหร่"
          aside={<span className="text-lg font-extrabold tracking-tight">฿{formatBaht(result.total)}</span>}
        >
          {result.unassigned.length > 0 && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
              มี {result.unassigned.length} รายการที่ยังไม่มีคนกิน ยอดจึงยังไม่ครบ
            </p>
          )}
          <ul className="flex flex-col divide-y divide-stone-200">
            {result.shares.map((s) => (
              <li key={s.personId} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{nameOf(s.personId)}</p>
                  <p className="text-xs text-stone-400">
                    อาหาร ฿{formatBaht(s.subtotal)}
                    {s.service + s.vat > 0 && ` + ค่าบริการ/VAT ฿${formatBaht(s.service + s.vat)}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-extrabold tracking-tight">฿{formatBaht(s.total)}</span>
                  <Button size="sm" variant="ghost" disabled={!ppOk || s.total === 0} onClick={() => setQrFor(s.personId)}>
                    QR
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <Button size="lg" className="w-full" disabled={!canSave || saving} onClick={save}>
              {saving ? "กำลังบันทึก…" : "บันทึกและสร้างลิงก์ให้เพื่อน"}
            </Button>
            {!ppOk && <p className="text-center text-xs text-stone-400">กรอกเบอร์ PromptPay ในขั้นที่ 1 ก่อนถึงจะบันทึกและสร้าง QR ได้</p>}
            {saveError && (
              <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-center text-sm text-rose-700">
                {saveError}
              </p>
            )}
          </div>
        </StepCard>
      )}

      <ReceiptScan open={scanOpen} onOpenChange={setScanOpen} onApply={applyScanned} />

      {qrShare && (
        <QrSheet
          open
          onOpenChange={(o) => !o && setQrFor(null)}
          name={nameOf(qrShare.personId)}
          amount={qrShare.total}
          promptPayId={promptPayId}
        />
      )}
    </main>
  );
}
