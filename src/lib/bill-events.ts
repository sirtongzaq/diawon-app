/**
 * event ภายในแอป: "ข้อมูลบิลเปลี่ยน" (มีสลิปใหม่ / เจ้าของอนุมัติ / ไม่อนุมัติ)
 * ให้ badge ที่เมนูและหน้ารายการบิลโหลดสถานะใหม่ โดยไม่ต้องผูก component เข้าหากัน
 */
const EVENT = "diawon:bills-changed";

export function emitBillsChanged() {
  window.dispatchEvent(new Event(EVENT));
}

export function onBillsChanged(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
