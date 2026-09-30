import test from "node:test";
import assert from "node:assert/strict";
import { allocate, computeSplit } from "./split";

test("allocate: ผลรวมเท่ากับ total เสมอ", () => {
  assert.deepEqual(allocate(100, [1, 1, 1]), [34, 33, 33]);
  assert.equal(allocate(1001, [3, 5, 7]).reduce((a, b) => a + b, 0), 1001);
  assert.deepEqual(allocate(0, [1, 2]), [0, 0]);
});

test("computeSplit: service 10% + VAT 7%", () => {
  const people = [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
    { id: "c", name: "C" },
  ];
  const items = [
    { id: "1", name: "ผัดไทย", price: 12000, people: ["a"] },
    { id: "2", name: "ต้มยำ", price: 30000, people: ["a", "b", "c"] },
    { id: "3", name: "เบียร์", price: 9000, people: ["b"] },
  ];
  const r = computeSplit(people, items, { servicePct: 10, vatPct: 7 });
  assert.equal(r.subtotal, 51000);
  assert.equal(r.service, 5100);
  assert.equal(r.vat, Math.round((51000 + 5100) * 0.07));
  assert.equal(r.shares.reduce((s, x) => s + x.total, 0), r.total);
  assert.equal(r.unassigned.length, 0);
});

test("computeSplit: รายการที่ไม่มีคนกินถูกรายงาน", () => {
  const r = computeSplit(
    [{ id: "a", name: "A" }],
    [{ id: "1", name: "x", price: 1000, people: [] }],
    { servicePct: 0, vatPct: 0 },
  );
  assert.equal(r.unassigned.length, 1);
  assert.equal(r.total, 0);
});
