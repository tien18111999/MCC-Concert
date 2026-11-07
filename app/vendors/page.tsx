import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { Vendors } from "@/components/Vendors";

export const metadata: Metadata = {
  title: "Vendors | MCC Turn It Up",
  description: "Food, drinks, and merchandise vendors at MCC Turn It Up.",
};

export default function VendorsPage() {
  return (
    <PageFrame>
      <Vendors />
    </PageFrame>
  );
}
