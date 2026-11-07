import { event, schedule } from "@/lib/content";

export function Schedule() {
  return (
    <section id="schedules" className="scroll-mt-24 border-t border-white/10 bg-black px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#ff7ac6]">
            Lineup
          </p>
          <h1 className="mt-3 font-display text-5xl leading-none text-white sm:text-6xl">
            Festival schedule
          </h1>
          <p className="mt-4 text-sm text-white/55">
            {event.date} · {event.place}
          </p>
        </div>
        <ol className="mt-10 space-y-3">
          {schedule.map((item) => (
            <li
              key={item.title}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 sm:flex-row sm:items-center"
            >
              <span className="w-16 shrink-0 font-display text-2xl tracking-wide text-white/40">
                {item.time}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-white">{item.title}</span>
                <span className="mt-1 block text-sm text-white/50">{item.note}</span>
              </span>
              <span className="w-fit rounded-full bg-[#ff2d95]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#ff9ad0]">
                {item.tag}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
