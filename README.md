# เดี๋ยวโอน (Diaw Onn)

หารบิลกับเพื่อน สร้าง QR PromptPay รายคน — Next.js 16 + Tailwind 4 + shadcn/ui (Radix) + Supabase

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env.local   # ใส่ค่า Supabase (ยังไม่จำเป็นสำหรับ MVP หารบิล/QR)
npm run dev                  # http://localhost:3000
npm test                     # ทดสอบตรรกะหารบิล
```

## โครงสร้าง

- `src/lib/split.ts` ตรรกะหาร (หน่วยสตางค์, service/VAT, กระจายเศษให้ผลรวมเท่าเป๊ะ)
- `src/lib/promptpay.ts` สร้าง payload/QR PromptPay
- `src/features/bill/` หน้าจอหารบิล + sheet แสดง QR
- `src/components/ui/` คอมโพเนนต์แบบ shadcn/ui (button, input, switch, sheet)
- `supabase/schema.sql` schema เริ่มต้น (bills / people / items)

## Deploy

เชื่อม repo กับ Vercel แล้วตั้ง env `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
