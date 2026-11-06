const slots = Array.from({ length: 12 }, (_, index) => index + 1);

export function Sponsorships() {
  return (
    <section id="sponsorships" className="scroll-mt-24 bg-black px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl border border-white/15 px-4 py-10 sm:px-8 sm:py-14">
        <h2 className="text-center text-sm font-bold uppercase tracking-[0.35em] text-white">
          Sponsorships
        </h2>
        <p className="mt-3 text-center text-sm text-white/50">Partner logos coming soon.</p>
        <p className="mt-4 text-center">
          <a href="/sponsorships" className="text-sm font-semibold text-[#ff7ac6] hover:text-white">
            View sponsorship packages
          </a>
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {slots.map((slot) => (
            <li
              key={slot}
              className="grid aspect-square place-items-center bg-white text-xs font-semibold uppercase tracking-wide text-zinc-400"
            >
              Logo
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
