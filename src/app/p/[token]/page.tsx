import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { LiveStatus } from "@/features/bill/live-status";
import { PayQr } from "@/features/bill/pay-qr";
import { SlipUpload } from "@/features/bill/slip-upload";
import { getBillByPersonToken, NotConfiguredError } from "@/lib/server/bills";
import { formatBaht } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "ยอดของคุณ — เดี๋ยวโอน",
  robots: { index: false, follow: false },
};

export default async function FriendPage({ params }: PageProps<"/p/[token]">) {
  const { token } = await params;

  let data;
  try {
    data = await getBillByPersonToken(token);
  } catch (e) {
    if (e instanceof NotConfiguredError) notFound();
    throw e;
  }
  if (!data) notFound();

  const { bill, me, share } = data;
  const paid = !!me.paid_at;
  const fees = share.service + share.vat;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-4 pb-32">
      <LiveStatus token={token} paid={paid} />
      <section className="text-center">
        <p className="text-sm text-stone-500">{bill.title}</p>
        <h1 className="mt-1 text-lg font-bold">{me.name}</h1>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">฿{formatBaht(me.total_satang)}</p>
      </section>

      {paid ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-card px-4 py-8 text-center">
          <CheckCircle2 className="size-10 text-brand" aria-hidden="true" />
          <p className="font-semibold">โอนเรียบร้อยแล้ว</p>
          <p className="text-sm text-stone-500">ขอบคุณที่โอนนะ</p>
        </div>
      ) : (
        <PayQr promptPayId={bill.promptpay_id} amount={me.total_satang} name={me.name} />
      )}

      {!paid && (
        <SlipUpload token={token} pending={!!me.slip_path} uploadedAt={me.slip_uploaded_at} />
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-stone-700">ยอดนี้มาจากอะไร</h2>
        <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-card">
          {share.lines.map((l) => (
            <li key={l.itemId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>
                {l.name}
                {l.sharedWith > 1 && <span className="text-stone-400"> · หาร {l.sharedWith} คน</span>}
              </span>
              <span>฿{formatBaht(l.amount)}</span>
            </li>
          ))}
          {fees > 0 && (
            <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-stone-500">
              <span>ค่าบริการ / VAT</span>
              <span>฿{formatBaht(fees)}</span>
            </li>
          )}
          <li className="flex items-center justify-between gap-3 px-4 py-3 font-semibold">
            <span>รวม</span>
            <span>฿{formatBaht(me.total_satang)}</span>
          </li>
        </ul>
      </section>
    </main>
  );
}
