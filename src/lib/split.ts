/**
 * ตรรกะหารบิล — เงินทั้งหมดเป็น "สตางค์" (จำนวนเต็ม) กันเศษทศนิยมเพี้ยน
 * ผลรวมของทุกคนจะเท่ากับยอดบิลเป๊ะ (ใช้ largest remainder แจกเศษ)
 */
export type Person = { id: string; name: string };
export type Item = {
  id: string;
  name: string;
  /** ราคารวมของรายการนี้ (สตางค์) */
  price: number;
  /** id ของคนที่กินร่วมกัน (หารเท่ากัน) */
  people: string[];
};
export type Fees = { servicePct: number; vatPct: number };

export type PersonShare = {
  personId: string;
  subtotal: number;
  service: number;
  vat: number;
  total: number;
};

export type SplitResult = {
  shares: PersonShare[];
  subtotal: number;
  service: number;
  vat: number;
  total: number;
  /** รายการที่ยังไม่ได้เลือกคนกิน */
  unassigned: Item[];
};

/** แจก total ตามน้ำหนัก โดยผลรวมต้องเท่ากับ total พอดี */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || total === 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map(Math.floor);
  let rest = total - out.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ frac: r - Math.floor(r), i }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; rest > 0; k = (k + 1) % order.length, rest--) {
    out[order[k].i]++;
  }
  return out;
}

export function computeSplit(
  people: Person[],
  items: Item[],
  fees: Fees,
): SplitResult {
  const idx = new Map(people.map((p, i) => [p.id, i]));
  const sub = people.map(() => 0);
  const unassigned: Item[] = [];

  for (const item of items) {
    const eaters = item.people.filter((id) => idx.has(id));
    if (eaters.length === 0) {
      if (item.price > 0) unassigned.push(item);
      continue;
    }
    const parts = allocate(item.price, eaters.map(() => 1));
    eaters.forEach((id, k) => (sub[idx.get(id)!] += parts[k]));
  }

  const subtotal = sub.reduce((a, b) => a + b, 0);
  const service = Math.round((subtotal * fees.servicePct) / 100);
  const serviceParts = allocate(service, sub);
  const base = sub.map((s, i) => s + serviceParts[i]);
  const vat = Math.round(((subtotal + service) * fees.vatPct) / 100);
  const vatParts = allocate(vat, base);

  const shares = people.map((p, i) => ({
    personId: p.id,
    subtotal: sub[i],
    service: serviceParts[i],
    vat: vatParts[i],
    total: sub[i] + serviceParts[i] + vatParts[i],
  }));

  return {
    shares,
    subtotal,
    service,
    vat,
    total: subtotal + service + vat,
    unassigned,
  };
}
