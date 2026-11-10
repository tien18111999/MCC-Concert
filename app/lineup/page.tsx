import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { Schedule } from "@/components/Schedule";

export const metadata: Metadata = {
  title: "Lineup & Schedule | MCC Turn It Up",
  description: "Artist lineup and set times for MCC Turn It Up at Columbus Park.",
};

export default function LineupPage() {
  return (
    <PageFrame>
      <Schedule />
    </PageFrame>
  );
}
