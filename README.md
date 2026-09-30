# เดี๋ยวโอน (Diaw Onn)

หารบิลกับเพื่อน สร้าง QR PromptPay รายคน แล้วส่งลิงก์ส่วนตัวให้เพื่อนแต่ละคน — Next.js 16 + Tailwind 4 + shadcn/ui (Radix) + Supabase

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env.local   # ใส่ค่า Supabase (ดูด้านล่าง)
npm run dev                  # http://localhost:3000
npm test                     # ทดสอบตรรกะหารบิล + ตรวจ input
```

## ตั้งค่า Supabase

1. สร้างโปรเจกต์ที่ supabase.com
2. เปิด **SQL Editor** แล้วรันทั้งไฟล์ `supabase/schema.sql`
3. ใส่ค่าใน `.env.local` (Project Settings → API)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามใส่ `NEXT_PUBLIC_`)

ตารางเปิด RLS โดยไม่มี policy จึงอ่าน/เขียนตรงจากเบราว์เซอร์ไม่ได้ ทุกอย่างผ่าน route handler ที่ตรวจ token เอง

## หน้าและ API

| Path | ทำอะไร |
|---|---|
| `/` | หน้าแรก + บิลล่าสุด (เก็บในเครื่อง) |
| `/bill` | สร้างบิล เลือกคนกิน แล้วกด "บันทึกและสร้างลิงก์" |
| `/manage/[adminToken]` | เจ้าของบิล: คัดลอก/ส่ง LINE ลิงก์รายคน, ติ๊กโอนแล้ว |
| `/p/[token]` | เพื่อน: ดูยอดของตัวเอง + QR PromptPay |
| `POST /api/bills` | สร้างบิล (คำนวณยอดซ้ำฝั่งเซิร์ฟเวอร์) |
| `POST /api/manage/[adminToken]/paid` | ติ๊ก/ยกเลิกโอนแล้ว |

ลิงก์เป็น token สุ่มยาว ใครมีลิงก์ก็เข้าได้ (ไม่มีล็อกอิน) — ลิงก์เจ้าของบิลจึงควรเก็บไว้คนเดียว

## โครงสร้าง

- `src/lib/split.ts` ตรรกะหาร (สตางค์, service/VAT, ผลรวมตรงเป๊ะ)
- `src/lib/bill-input.ts` ตรวจ payload ที่ client ส่งมา
- `src/lib/server/` Supabase (service role) และ data layer ของบิล
- `src/features/bill/` หน้าจอหารบิล, จัดการบิล, QR
- `src/components/ui/` คอมโพเนนต์แบบ shadcn/ui

## Deploy

เชื่อม repo กับ Vercel แล้วตั้ง env 2 ตัวข้างบนใน Project Settings → Environment Variables
