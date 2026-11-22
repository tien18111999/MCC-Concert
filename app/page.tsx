import { About } from "@/components/About";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SignupBand } from "@/components/SignupBand";
import { Sponsorships } from "@/components/Sponsorships";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <SignupBand />
        <Sponsorships />
      </main>
      <Footer />
    </>
  );
}
