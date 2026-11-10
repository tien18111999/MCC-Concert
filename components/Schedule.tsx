import { event, schedule } from "@/lib/content";

export function Schedule() {
  return (
    <section id="lineup" className="scroll-mt-24 border-t border-white/10 bg-black px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#ff7ac6]">Saturday, June 12</p>
          <h1 className="mt-3 font-display text-5xl leading-none text-white sm:text-6xl">Lineup & Schedule</h1>
          <p className="mt-4 text-sm text-white/55">
            {event.date} · {event.time} · {event.place}
          </p>
        </div>
        <ol className="mt-10 space-y-3">
          {schedule.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-5 sm:flex sm:items-center sm:justify-between sm:gap-6"
            >
              <p className="font-display text-3xl tracking-wide text-[#ff7ac6]">{item.time}</p>
              <p className="mt-1 text-xl font-semibold text-white sm:mt-0 sm:text-right">{item.title}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
