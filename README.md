# เดี๋ยวโอน (Diaw Onn)

หารบิลกับเพื่อน ส่ง QR PromptPay รายคน ตรวจสลิปโอนเงิน และเห็นสถานะแบบ realtime — เพื่อนไม่ต้องสมัครสมาชิกหรือโหลดแอป

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · shadcn/ui (Radix) · Supabase (Postgres, Storage, Realtime) · Tesseract.js

## ทำอะไรได้บ้าง

- **หารบิลอัตโนมัติ** เลือกว่าใครกินอะไร รวม Service charge 10% และ VAT 7% ให้ คำนวณเป็นสตางค์และกระจายเศษให้ผลรวมตรงยอดเป๊ะ
- **QR PromptPay รายคน** ใส่ยอดของแต่ละคนให้แล้ว
- **ลิงก์ส่วนตัว** เพื่อนแต่ละคนเปิดดูเฉพาะยอดของตัวเอง ไม่ต้องล็อกอิน
- **แนบสลิป + อนุมัติ** เพื่อนส่งรูปสลิป เจ้าของบิลตรวจแล้วกดอนุมัติหรือไม่อนุมัติ (ให้ส่งใหม่)
- **Realtime** เพื่อนส่งสลิป → เจ้าของเห็น toast และ badge บนเมนู · เจ้าของอนุมัติ → หน้าเพื่อนเปลี่ยนเป็น "โอนแล้ว" เอง
- **สแกนใบเสร็จ (Beta)** อ่านรายการจากรูปด้วย OCR ในเบราว์เซอร์ (ไม่ส่งรูปออกไปไหน) แล้วให้ตรวจแก้ก่อนเติมลงบิล
- **ธีมสว่าง/มืด** สลับได้ จำค่าไว้ในเครื่อง

ยังไม่มี: ระบบเตือนคนที่ยังไม่โอนอัตโนมัติ (แสดงเป็น "เร็วๆ นี้" ในหน้า Home)

## เริ่มใช้งาน

ต้องมี Node.js 20.9 ขึ้นไป

```bash
npm install
cp .env.example .env.local   # แล้วกรอกค่าตามหัวข้อถัดไป
npm run dev                  # http://localhost:3000
```

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รันโหมดพัฒนา |
| `npm run build` / `npm start` | build และรัน production |
| `npm run lint` | ตรวจโค้ด (ESLint) |
| `npm run typecheck` | ตรวจ TypeScript |
| `npm test` | ทดสอบตรรกะหารบิล, ตรวจ input, ชื่อ channel, แยกข้อความใบเสร็จ ฯลฯ |

## ตั้งค่า Supabase

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com)
2. เปิด **SQL Editor** แล้วรันทั้งไฟล์ `supabase/schema.sql` (รันซ้ำได้ปลอดภัย) — สร้างตาราง `bills`, `people`, `items`, คอลัมน์สลิป และ bucket `slips` แบบ private
3. ใส่ค่าใน `.env.local` (Project Settings → API Keys)

| ตัวแปร | คีย์ | หมายเหตุ |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` (หรือ anon) | คีย์สาธารณะ ใช้รับ realtime ในเบราว์เซอร์ ถ้าไม่ตั้ง ระบบยังทำงานได้แต่อัปเดตช้าลง (โหลดซ้ำเอง) |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` (หรือ service_role) | **คีย์ลับ** ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามใส่ `NEXT_PUBLIC_` ห้าม commit |

> อย่าเอาคีย์ `sb_publishable_` ไปใส่ช่อง `SUPABASE_SERVICE_ROLE_KEY` — เซิร์ฟเวอร์จะถูกมองเป็นผู้ใช้ทั่วไปและชน RLS (`new row violates row-level security policy`)

## หน้าและ API

| Path | ทำอะไร |
|---|---|
| `/` | หน้าแรก: อธิบายการทำงาน + บิลล่าสุด |
| `/bill` | สร้างบิล (ชื่อบิล, เบอร์ PromptPay, เพื่อน, รายการ, สแกนใบเสร็จ) |
| `/bills` | รายการบิลทั้งหมดที่สร้างจากเครื่องนี้ + สถานะโอน + badge สลิปรอตรวจ |
| `/manage/[adminToken]` | เจ้าของบิล: คัดลอก/ส่ง LINE ลิงก์รายคน, ดูสลิป, อนุมัติ/ไม่อนุมัติ, ติ๊กโอนแล้ว |
| `/p/[token]` | เพื่อน: ดูยอดตัวเอง, QR PromptPay, แนบสลิป |

| API | ทำอะไร |
|---|---|
| `POST /api/bills` | สร้างบิล (คำนวณยอดซ้ำฝั่งเซิร์ฟเวอร์ ไม่เชื่อยอดจาก client) |
| `POST /api/bills/summary` | สรุปสถานะหลายบิล (ใช้กับหน้ารายการและ badge) |
| `POST /api/manage/[adminToken]/paid` | ติ๊ก/ยกเลิกโอนแล้ว (อนุมัติสลิป) |
| `POST /api/manage/[adminToken]/slip/reject` | ไม่อนุมัติสลิป (ลบสลิป ให้ส่งใหม่) |
| `POST /api/p/[token]/slip` | เพื่อนอัปโหลดสลิป |

## ความปลอดภัย

- ไม่มีระบบล็อกอิน ทุกลิงก์เป็น **token สุ่มยาว** ใครมีลิงก์ก็เข้าได้ ลิงก์ `/manage/...` ควรเก็บไว้คนเดียว
- ตารางเปิด RLS โดยไม่มี policy → อ่าน/เขียนตรงจากเบราว์เซอร์ไม่ได้ ทุกอย่างผ่าน route handler (service role) ที่ตรวจ token เอง
- สลิปเก็บใน bucket private ตรวจชนิดไฟล์จากเนื้อไฟล์จริง (JPG/PNG/WEBP, ไม่เกิน 4 MB) เจ้าของดูผ่าน signed URL อายุ 1 ชั่วโมง
- ช่อง realtime ตั้งชื่อจาก hash ของ token จึงเดาไม่ได้ และย้อนกลับไปหา token ไม่ได้
- ยังไม่มี rate limit ที่ API ควรเพิ่มก่อนเปิดให้คนทั่วไปใช้

## ข้อควรรู้

- **รายการบิลจำไว้ในเครื่อง (localStorage)** เปิดจากเครื่องอื่นหรือล้างข้อมูลเบราว์เซอร์แล้วจะไม่เห็นบิลเก่า (ลิงก์ `/manage/...` ยังใช้ได้ถ้าเก็บไว้)
- **สแกนใบเสร็จ** ใช้ Tesseract.js ครั้งแรกจะโหลดโมเดลภาษาไทยจาก CDN (ไม่กี่ MB) แล้วจำไว้ในเบราว์เซอร์ ความแม่นขึ้นกับคุณภาพรูป ผลอาจคลาดเคลื่อนจึงมีหน้าตรวจแก้ทุกครั้ง
- สลิปถูกย่อในเบราว์เซอร์ก่อนอัปโหลด เพราะ Vercel จำกัดขนาด request body ประมาณ 4.5 MB
- ช่องเบอร์ PromptPay รับเฉพาะเบอร์มือถือ 10 หลัก

## โครงสร้างโปรเจกต์

```
src/
  app/                  หน้าและ API (App Router)
  components/           bottom-nav, theme-toggle, toaster, ui/ (shadcn: button, input, switch, sheet)
  features/bill/        หน้าจอสร้างบิล, จัดการบิล, สแกนใบเสร็จ, แนบสลิป, QR, live status
  hooks/                use-theme, use-bill-alerts (realtime + badge), use-persisted-string
  lib/
    split.ts            ตรรกะหาร (สตางค์, service/VAT, กระจายเศษ)
    bill-input.ts       ตรวจ payload ที่ client ส่งมา
    receipt-parse.ts    แยกรายการจากข้อความ OCR
    ocr.ts              เตรียมรูป + เรียก Tesseract.js
    bill-channel.ts     ชื่อ channel/เหตุการณ์ realtime
    server/             Supabase (service role) และ data layer ของบิล/สลิป
supabase/schema.sql     schema + bucket (รันใน SQL Editor)
```

สีและธีมทั้งแอปแก้ได้ที่ `src/app/globals.css` ไฟล์เดียว

## Deploy

เชื่อม repo กับ [Vercel](https://vercel.com) แล้วตั้ง env ทั้ง 3 ตัวใน Project Settings → Environment Variables จากนั้น deploy ได้เลย (ไม่ต้องมีเซิร์ฟเวอร์อื่น)
