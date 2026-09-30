import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ManageBill } from "@/features/bill/manage-bill";
import { getBillByAdminToken, getSlipUrls, NotConfiguredError } from "@/lib/server/bills";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "จัดการบิล — เดี๋ยวโอน",
  robots: { index: false, follow: false },
};

export default async function ManagePage({ params }: PageProps<"/manage/[adminToken]">) {
  const { adminToken } = await params;

  let view;
  try {
    view = await getBillByAdminToken(adminToken);
  } catch (e) {
    if (e instanceof NotConfiguredError) notFound();
    throw e;
  }
  if (!view) notFound();

  // signed URL ของสลิป (bucket private) — ถ้าสร้างไม่ได้ก็ยังเปิดหน้าได้ แค่ไม่มีรูป
  const paths = view.people.flatMap((p) => (p.slip_path ? [p.slip_path] : []));
  const urls = await getSlipUrls(paths).catch((e) => {
    console.error("getSlipUrls failed", e);
    return {} as Record<string, string>;
  });

  return (
    <ManageBill
      adminToken={adminToken}
      title={view.bill.title}
      total={view.split.total}
      people={view.people.map((p) => ({
        id: p.id,
        name: p.name,
        token: p.token,
        total: p.total_satang,
        paid: !!p.paid_at,
        hasSlip: !!p.slip_path,
        slipUrl: p.slip_path ? (urls[p.slip_path] ?? null) : null,
        slipAt: p.slip_uploaded_at,
      }))}
    />
  );
}
