import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sponsorships } from "@/components/Sponsorships";
import { TicketDesk } from "@/components/TicketDesk";

export const metadata: Metadata = {
  title: "Tickets | MCC Turn It Up",
  description: "Buy MCC Turn It Up tickets. Early bird, general admission, and senior prices. Kids under 12 are free.",
};

export default function TicketsPage() {
  return (
    <>
      <Header solid />
      <main className="bg-black">
        <TicketDesk />
        <Sponsorships />
      </main>
      <Footer />
    </>
  );
}
