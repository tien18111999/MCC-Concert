import { About } from "@/components/About";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Lineup } from "@/components/Lineup";
import { Schedule } from "@/components/Schedule";
import { SignupBand } from "@/components/SignupBand";
import { SiteMap } from "@/components/SiteMap";
import { Sponsorships } from "@/components/Sponsorships";
import { Vendors } from "@/components/Vendors";
import { Volunteer } from "@/components/Volunteer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <SignupBand />
        <Sponsorships />
        <Lineup />
        <Schedule />
        <Vendors />
        <SiteMap />
        <Volunteer />
      </main>
      <Footer />
    </>
  );
}
