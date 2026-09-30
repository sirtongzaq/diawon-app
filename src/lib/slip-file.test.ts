import test from "node:test";
import assert from "node:assert/strict";
import { sniffImage } from "./slip-file";

const bytes = (...n: number[]) => new Uint8Array(n);

test("sniffImage: รู้จัก jpg / png / webp", () => {
  assert.equal(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext, "jpg");
  assert.equal(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))?.ext, "png");
  const webp = bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50);
  assert.equal(sniffImage(webp)?.contentType, "image/webp");
});

test("sniffImage: ปฏิเสธไฟล์อื่น (เช่น html/svg/pdf ที่เปลี่ยนนามสกุล)", () => {
  assert.equal(sniffImage(new TextEncoder().encode("<svg xmlns=...>")), null);
  assert.equal(sniffImage(new TextEncoder().encode("%PDF-1.7")), null);
  assert.equal(sniffImage(bytes()), null);
});
