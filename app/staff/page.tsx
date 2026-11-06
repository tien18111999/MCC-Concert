import type { Metadata } from "next";
import { StaffConsole } from "@/components/StaffConsole";

export const metadata: Metadata = {
  title: "Staff waitlist | MCC Turn It Up",
  robots: { index: false, follow: false },
};

export default function StaffPage() {
  return <StaffConsole />;
}
