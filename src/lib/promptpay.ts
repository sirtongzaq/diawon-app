import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

/** เบอร์โทร 10 หลัก / เลขบัตร ปชช. 13 หลัก / e-Wallet 15 หลัก */
export function normalizePromptPayId(raw: string) {
  return raw.replace(/\D/g, "");
}

export function isValidPromptPayId(raw: string) {
  const id = normalizePromptPayId(raw);
  return [10, 13, 15].includes(id.length);
}

/** เบอร์มือถือไทย 10 หลัก ขึ้นต้น 06 / 08 / 09 (และ 05 / 07 ตามช่วงเบอร์ที่เปิดใช้) */
export function isValidThaiPhone(raw: string) {
  return /^0[56789]\d{8}$/.test(raw);
}

/** amountSatang = 0 → QR แบบไม่ระบุยอด */
export function promptPayPayload(id: string, amountSatang: number) {
  const opts = amountSatang > 0 ? { amount: amountSatang / 100 } : {};
  return generatePayload(normalizePromptPayId(id), opts);
}

export function promptPayQrDataUrl(id: string, amountSatang: number) {
  return QRCode.toDataURL(promptPayPayload(id, amountSatang), {
    margin: 1,
    width: 512,
    errorCorrectionLevel: "M",
  });
}
