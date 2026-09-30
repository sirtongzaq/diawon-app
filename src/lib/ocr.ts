/**
 * OCR ใบเสร็จในเบราว์เซอร์ด้วย Tesseract.js (ฟรี ไม่ส่งรูปออกไปไหน)
 * เรียกได้เฉพาะฝั่ง client — tesseract.js ถูก import แบบ dynamic เพื่อไม่ให้ทุกหน้าต้องโหลด
 */
export type OcrProgress = { status: string; progress: number };

const MIN_WIDTH = 1400; // รูปเล็กเกินไปตัวอักษรจะพร่า → ขยาย
const MAX_WIDTH = 2400; // ใหญ่เกินไปช้าและกิน RAM บนมือถือ → ย่อ

/**
 * เตรียมรูปให้ OCR อ่านง่ายขึ้น: ปรับขนาด → ขาวดำ → ยืดคอนทราสต์
 * (ขั้นนี้ช่วยความแม่นกับใบเสร็จ thermal ที่ตัวจางได้มากกว่าเปลี่ยนไลบรารี)
 */
export async function preprocessReceipt(file: File): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file);
  const scale = bmp.width < MIN_WIDTH ? MIN_WIDTH / bmp.width : bmp.width > MAX_WIDTH ? MAX_WIDTH / bmp.width : 1;
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("เบราว์เซอร์นี้ประมวลผลรูปไม่ได้");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();

  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < px.length; i += 4) {
    const g = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
    px[i] = px[i + 1] = px[i + 2] = g;
    hist[g]++;
  }

  // ยืดช่วงสว่าง: ตัด 1% มืดสุด/สว่างสุด แล้วขยายให้เต็ม 0–255
  const total = w * h;
  let lo = 0;
  let hi = 255;
  for (let acc = 0; lo < 255 && (acc += hist[lo]) < total * 0.01; lo++);
  for (let acc = 0; hi > 0 && (acc += hist[hi]) < total * 0.01; hi--);
  if (hi - lo > 20) {
    const k = 255 / (hi - lo);
    for (let i = 0; i < px.length; i += 4) {
      const v = Math.max(0, Math.min(255, (px[i] - lo) * k));
      px[i] = px[i + 1] = px[i + 2] = v;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** อ่านข้อความทั้งหมดจากรูปใบเสร็จ (ไทย + อังกฤษ) */
export async function readReceiptText(file: File, onProgress?: (p: OcrProgress) => void): Promise<string> {
  const canvas = await preprocessReceipt(file);
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["tha", "eng"], 1, {
    logger: (m) => onProgress?.({ status: m.status, progress: m.progress }),
  });
  try {
    // PSM 6 = ข้อความบล็อกเดียว เหมาะกับใบเสร็จ; เก็บช่องว่างระหว่างคอลัมน์ไว้ให้แยกชื่อ/ราคาได้
    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      preserve_interword_spaces: "1",
    } as never);
    const { data } = await worker.recognize(canvas);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
