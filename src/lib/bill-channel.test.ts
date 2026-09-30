import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { billTopic, personTopic } from "./bill-channel";

test("billTopic: ตรงกับ sha256 ฝั่ง node (server กับ browser ต้องได้ชื่อเดียวกัน)", async () => {
  const token = "_hBtr0DPoY-ZJyKZOCO7aw";
  const expected = `bill-${createHash("sha256").update(token).digest("hex").slice(0, 32)}`;
  assert.equal(await billTopic(token), expected);
  assert.notEqual(await billTopic("other"), expected);
});

test("personTopic: ตรงกับฝั่ง node และไม่ชนกับ billTopic ของ token เดียวกัน", async () => {
  const token = "ilJX1JyPzROtslbi";
  const expected = `person-${createHash("sha256").update(token).digest("hex").slice(0, 32)}`;
  assert.equal(await personTopic(token), expected);
  assert.notEqual(await personTopic(token), await billTopic(token));
});
