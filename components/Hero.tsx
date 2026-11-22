import { event } from "@/lib/content";

export function Hero() {
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden bg-black">
      <div
        className="absolute inset-0 bg-cover bg-center grayscale contrast-125"
        style={{ backgroundImage: "url(/skyline.jpg)" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,45,149,0.16),transparent_58%)]" />

      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 pb-16 pt-28 text-center">
        <p className="text-[11px] font-semibold uppercase leading-5 tracking-[0.16em] text-[#ff7ac6] sm:tracking-[0.22em] xl:hidden">
          <span className="block">
            {event.city} · {event.place}
          </span>
          <span className="block">{event.date}</span>
          <span className="block">{event.time}</span>
        </p>
        <h1 className="mt-6 font-display text-[clamp(3.25rem,16vw,8.5rem)] leading-[0.84] text-white">
          MCC
          <span className="mt-1 block bg-gradient-to-r from-fuchsia-200 via-[#ff2d95] to-violet-300 bg-clip-text text-transparent">
            Turn It Up
          </span>
        </h1>
        <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 sm:text-sm sm:tracking-[0.32em]">
          {event.kicker}
        </p>
        <p className="mt-3 max-w-xl text-lg text-white sm:text-2xl">{event.tagline}</p>
      </div>
    </section>
  );
}
