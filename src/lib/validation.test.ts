import test from "node:test";
import assert from "node:assert/strict";
import { isValidThaiPhone } from "./promptpay";
import { parseBaht, sanitizeAmount } from "./utils";

test("isValidThaiPhone", () => {
  for (const ok of ["0812345678", "0623456789", "0912345678"]) assert.ok(isValidThaiPhone(ok), ok);
  for (const bad of ["", "081234567", "08123456789", "1812345678", "081-234-5678", "abcdefghij"]) {
    assert.equal(isValidThaiPhone(bad), false, bad);
  }
});

test("sanitizeAmount: เหลือเฉพาะตัวเลขและทศนิยมไม่เกิน 2 หลัก", () => {
  assert.equal(sanitizeAmount("12a3"), "123");
  assert.equal(sanitizeAmount("45.567"), "45.56");
  assert.equal(sanitizeAmount("1.2.3"), "1.23");
  assert.equal(sanitizeAmount("-5"), "5");
  assert.equal(sanitizeAmount("฿ 99"), "99");
  assert.equal(sanitizeAmount(""), "");
  assert.equal(parseBaht(sanitizeAmount("45.5")), 4550);
  assert.equal(parseBaht(sanitizeAmount("0")), 0);
});
