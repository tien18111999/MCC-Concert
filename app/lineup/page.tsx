import type { Metadata } from "next";
import { Lineup } from "@/components/Lineup";
import { PageFrame } from "@/components/PageFrame";

export const metadata: Metadata = {
  title: "Lineup | MCC Turn It Up",
  description: "Artists for MCC Turn It Up. Local bands, musicians, and the closing DJ.",
};

export default function LineupPage() {
  return (
    <PageFrame>
      <Lineup />
    </PageFrame>
  );
}
