import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { Schedule } from "@/components/Schedule";

export const metadata: Metadata = {
  title: "Schedule | MCC Turn It Up",
  description: "Festival schedule for MCC Turn It Up at Columbus Park.",
};

export default function SchedulePage() {
  return (
    <PageFrame>
      <Schedule />
    </PageFrame>
  );
}
