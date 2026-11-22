import type { Metadata } from "next";
import { ReportsDashboard } from "@/components/ReportsDashboard";

export const metadata: Metadata = {
  title: "Ticket sales report | MCC Turn It Up",
  robots: { index: false, follow: false },
};

export default function ReportsPage() {
  return <ReportsDashboard />;
}
