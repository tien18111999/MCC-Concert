const slots = ["Food truck", "Drinks", "Merch", "Community booth"];

export function Vendors() {
  return (
    <section id="vendors" className="scroll-mt-24 border-t border-white/10 bg-black px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#ff7ac6]">
          On site
        </p>
        <h1 className="mt-3 font-display text-5xl leading-none text-white sm:text-6xl">
          Vendors & partners
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
          A hand-picked set of 5–6 local food trucks, beverage stations, and merchandise booths.
          The lineup will be announced here.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {slots.map((slot) => (
            <div
              key={slot}
              className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-3 py-8 text-sm font-medium text-white/45"
            >
              {slot}
              <span className="mt-2 block text-xs uppercase tracking-[0.16em] text-[#ff7ac6]">
                Soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
