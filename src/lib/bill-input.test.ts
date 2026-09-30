import test from "node:test";
import assert from "node:assert/strict";
import { parseBillInput } from "./bill-input";

const base = () => ({
  title: "  หมูกระทะ ",
  promptPayId: "081-234-5678",
  servicePct: 10,
  vatPct: 7,
  people: [{ name: "A" }, { name: "B" }],
  items: [{ name: "หมู", priceSatang: 30000, people: [0, 1, 1] }],
});

test("parseBillInput: ข้อมูลถูกต้อง", () => {
  const r = parseBillInput(base());
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.title, "หมูกระทะ");
    assert.equal(r.value.promptPayId, "0812345678");
    assert.deepEqual(r.value.items[0].people, [0, 1]); // ตัดซ้ำ
  }
});

test("parseBillInput: ปฏิเสธข้อมูลผิด", () => {
  assert.equal(parseBillInput(null).ok, false);
  assert.equal(parseBillInput({ ...base(), promptPayId: "123" }).ok, false);
  assert.equal(parseBillInput({ ...base(), servicePct: 99 }).ok, false);
  assert.equal(parseBillInput({ ...base(), people: [] }).ok, false);
  assert.equal(
    parseBillInput({ ...base(), items: [{ name: "x", priceSatang: 100, people: [5] }] }).ok,
    false,
  );
  assert.equal(
    parseBillInput({ ...base(), items: [{ name: "x", priceSatang: 1.5, people: [0] }] }).ok,
    false,
  );
  assert.equal(
    parseBillInput({ ...base(), items: [{ name: "x", priceSatang: 100, people: [] }] }).ok,
    false,
  );
});
