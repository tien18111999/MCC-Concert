import type { Metadata } from "next";
import { PageFrame } from "@/components/PageFrame";
import { SiteMap } from "@/components/SiteMap";

export const metadata: Metadata = {
  title: "Map | MCC Turn It Up",
  description: "Festival site map for MCC Turn It Up at Columbus Park, Chicago.",
};

export default function MapPage() {
  return (
    <PageFrame>
      <SiteMap />
    </PageFrame>
  );
}
