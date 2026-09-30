import type { Metadata } from "next";
import { BillSplitter } from "@/features/bill/bill-splitter";

export const metadata: Metadata = { title: "สร้างบิล — เดี๋ยวโอน" };

export default function BillPage() {
  return <BillSplitter />;
}
