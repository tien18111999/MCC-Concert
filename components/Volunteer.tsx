import { VOLUNTEER_FORM_URL } from "@/lib/links";

export function Volunteer() {
  return (
    <section id="volunteer" className="scroll-mt-24 border-t border-white/10 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#2a0a3e] via-[#14081f] to-[#3a0d32] p-8 sm:p-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">
              Get involved
            </p>
            <h2 className="mt-3 font-display text-5xl leading-none text-white sm:text-6xl">
              Become a festival volunteer
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
              Help make the MCC Community Music Festival an easy day to be part of.
              Stage support, guest welcome, or the kids zone — the neighborhood shows up because people do.
            </p>
          </div>
          <div className="w-full md:w-auto">
            <a
              href={VOLUNTEER_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#ff2d95] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(255,45,149,0.35)] transition hover:bg-[#ff4aa8] md:w-auto"
            >
              Volunteer
            </a>
            <p className="mt-3 text-center text-xs text-white/45 md:text-left">
              Opens the volunteer registration form
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
