import { about } from "@/lib/content";

export function About() {
  return (
    <section id="about" className="scroll-mt-24 bg-black px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl border border-[#ff2d95]/40 px-6 py-14 text-center sm:px-12 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/80">
          What is MCC Turn It Up?
        </p>
        <h2 className="mx-auto mt-6 max-w-4xl text-balance font-display text-[clamp(2.4rem,8vw,4.5rem)] leading-[0.9] text-white">
          One day of live music and community under the Chicago skyline
        </h2>
        <p className="mx-auto mt-8 max-w-3xl text-base leading-relaxed text-white/75 sm:text-lg">
          {about.lead}
        </p>
      </div>
    </section>
  );
}
