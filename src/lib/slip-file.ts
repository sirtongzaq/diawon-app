export type ImageKind = { contentType: string; ext: string };

/** ดูชนิดไฟล์จาก magic bytes จริง (ไม่เชื่อ Content-Type / นามสกุลที่ client ส่งมา) */
export function sniffImage(b: Uint8Array): ImageKind | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { contentType: "image/jpeg", ext: "jpg" };
  }
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return { contentType: "image/png", ext: "png" };
  }
  // WEBP = "RIFF" + size(4) + "WEBP"
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return { contentType: "image/webp", ext: "webp" };
  }
  return null;
}
