import type { Metadata } from "next";
import { ForecastDesk } from "@/components/ForecastDesk";

export const metadata: Metadata = {
  title: "Festival forecast | MCC Turn It Up",
  robots: { index: false, follow: false },
};

export default function ForecastPage() {
  return <ForecastDesk />;
}
