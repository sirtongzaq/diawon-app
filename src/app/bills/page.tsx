import type { Metadata } from "next";
import { BillsList } from "@/features/bill/bills-list";

export const metadata: Metadata = { title: "รายการบิล — เดี๋ยวโอน" };

export default function BillsPage() {
  return <BillsList />;
}
