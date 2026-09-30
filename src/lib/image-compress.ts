/**
 * ย่อรูปสลิปฝั่งเบราว์เซอร์ก่อนอัปโหลด (ด้านยาวสุด 1600px, JPEG)
 * รูปจากมือถือมักหลาย MB ซึ่งเกินลิมิต body ของ serverless; สลิปย่อแล้วมักเหลือไม่ถึง 500 KB
 * คืนไฟล์เดิมถ้าย่อไม่ได้ (เช่น เบราว์เซอร์ถอดรหัสรูปไม่ได้) — ให้เซิร์ฟเวอร์ตรวจต่อ
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // PNG โปร่งใส → พื้นขาว
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], "slip.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
