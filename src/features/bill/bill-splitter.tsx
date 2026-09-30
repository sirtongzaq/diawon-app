"use client";
import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn, formatBaht, parseBaht, uid } from "@/lib/utils";
import { computeSplit, type Item, type Person } from "@/lib/split";
import { isValidPromptPayId } from "@/lib/promptpay";
import { usePersistedString } from "@/hooks/use-persisted-string";
import { QrSheet } from "./qr-sheet";

const PP_KEY = "diawon:promptpay";
const card = "rounded-2xl border border-stone-200 bg-card";

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

  const result = useMemo(
    () => computeSplit(people, items, { servicePct: service ? 10 : 0, vatPct: vat ? 7 : 0 }),
    [people, items, service, vat],
  );
  const ppOk = isValidPromptPayId(promptPayId);
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "";

  function addPerson() {
    const name = personName.trim();
    if (!name) return;
    const p = { id: uid(), name };
    setPeople((v) => [...v, p]);
    setPersonName("");
  }
  function removePerson(id: string) {
    setPeople((v) => v.filter((p) => p.id !== id));
    setItems((v) => v.map((i) => ({ ...i, people: i.people.filter((x) => x !== id) })));
  }
  function addItem() {
    const price = parseBaht(itemPrice);
    const name = itemName.trim();
    if (!name || !price) return;
    // เริ่มต้นให้ทุกคนหารเท่ากัน แล้วค่อยแตะปิดคนที่ไม่กิน
    setItems((v) => [...v, { id: uid(), name, price, people: people.map((p) => p.id) }]);
    setItemName("");
    setItemPrice("");
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

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-2 pb-32">
      <p className="text-sm text-stone-500">หารบิลกับเพื่อน ไม่ต้องทวงเอง</p>

      {/* 1) PromptPay ของเรา */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-stone-700">PromptPay ของคุณ</h2>
        <Input
          inputMode="numeric"
          placeholder="เบอร์โทร 10 หลัก หรือเลขบัตร 13 หลัก"
          value={promptPayId}
          onChange={(e) => setPromptPayId(e.target.value)}
          aria-invalid={promptPayId !== "" && !ppOk}
        />
        <p className="text-xs text-stone-400">
          {promptPayId && !ppOk ? "เบอร์/เลขไม่ครบ ลองตรวจอีกครั้ง" : "เก็บไว้ในเครื่องนี้เท่านั้น"}
        </p>
      </section>

      {/* 2) เพื่อนร่วมโต๊ะ */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-700">ใครมาบ้าง ({people.length})</h2>
        <form className="flex gap-2" onSubmit={(e) => (e.preventDefault(), addPerson())}>
          <Input maxLength={20} placeholder="ชื่อเพื่อน…" value={personName} onChange={(e) => setPersonName(e.target.value)} />
          <Button type="submit" aria-label="เพิ่มเพื่อน"><Plus className="size-4" />เพิ่ม</Button>
        </form>
        <ul className="flex flex-wrap gap-2">
          {people.map((p) => (
            <li key={p.id} className="flex items-center gap-0.5 rounded-full border border-stone-200 bg-card py-0.5 pr-0.5 pl-3 text-sm">
              {p.name}
              <button onClick={() => removePerson(p.id)} aria-label={`ลบ ${p.name}`} className="flex size-6 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-stone-900">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
          {people.length === 0 && <li className="text-sm text-stone-400">เพิ่มชื่อเพื่อนก่อนนะ</li>}
        </ul>
      </section>

      {/* 3) รายการอาหาร */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-700">รายการ ({items.length})</h2>
        <form className="flex gap-2" onSubmit={(e) => (e.preventDefault(), addItem())}>
          <Input maxLength={40} placeholder="ผัดไทย" value={itemName} onChange={(e) => setItemName(e.target.value)} />
          <Input inputMode="decimal" placeholder="฿" className="w-24 shrink-0" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} />
          <Button type="submit" size="icon" aria-label="เพิ่มรายการ" disabled={people.length === 0}><Plus className="size-4" /></Button>
        </form>
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.id} className={cn(card, "p-3")}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{i.name}</span>
                <span className="flex items-center gap-1 text-sm">
                  ฿{formatBaht(i.price)}
                  <button onClick={() => setItems((v) => v.filter((x) => x.id !== i.id))} aria-label={`ลบ ${i.name}`} className="flex size-6 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-stone-900">
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
                      className={cn("rounded-full border px-3 py-1 text-xs font-medium transition", on ? "border-accent bg-accent text-white" : "border-stone-200 bg-card text-stone-500 hover:bg-stone-100")}
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
      </section>

      {/* 4) ค่าบริการ / VAT */}
      <section className={cn(card, "divide-y divide-stone-200")}>
        {[
          { id: "svc", label: "Service charge 10%", checked: service, set: setService },
          { id: "vat", label: "VAT 7%", checked: vat, set: setVat },
        ].map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3">
            <label htmlFor={r.id} className="text-sm font-medium text-stone-700">{r.label}</label>
            <Switch id={r.id} checked={r.checked} onCheckedChange={r.set} />
          </div>
        ))}
      </section>

      {/* 5) สรุปรายคน */}
      {people.length > 0 && items.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-stone-700">ใครโอนเท่าไหร่</h2>
            <span className="text-sm text-stone-500">รวม ฿{formatBaht(result.total)}</span>
          </div>
          {result.unassigned.length > 0 && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
              มี {result.unassigned.length} รายการที่ยังไม่มีคนกิน ยอดจึงยังไม่ครบ
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {result.shares.map((s) => (
              <li key={s.personId} className={cn(card, "flex items-center justify-between p-3 pl-4")}>
                <div>
                  <p className="font-semibold">{nameOf(s.personId)}</p>
                  <p className="text-xs text-stone-400">อาหาร ฿{formatBaht(s.subtotal)}{s.service + s.vat > 0 && ` + ค่าบริการ/VAT ฿${formatBaht(s.service + s.vat)}`}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-extrabold tracking-tight">฿{formatBaht(s.total)}</span>
                  <Button size="sm" disabled={!ppOk || s.total === 0} onClick={() => setQrFor(s.personId)}>QR</Button>
                </div>
              </li>
            ))}
          </ul>
          {!ppOk && <p className="text-center text-xs text-stone-400">ใส่ PromptPay ด้านบนก่อนถึงจะสร้าง QR ได้</p>}
        </section>
      )}

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
