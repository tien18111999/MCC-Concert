import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { Volunteer } from "@/components/Volunteer";

export const metadata: Metadata = {
  title: "Volunteer | MCC Turn It Up",
  description: "Volunteer for MCC Turn It Up. Register and the team will assign your role.",
};

export default function VolunteerPage() {
  return (
    <PageFrame>
      <Volunteer />
    </PageFrame>
  );
}
