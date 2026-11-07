import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sponsorships } from "@/components/Sponsorships";

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <Header solid />
      <main className="bg-black pt-16 sm:pt-[4.5rem]">
        {children}
        <Sponsorships />
      </main>
      <Footer />
    </>
  );
}
