import { vendors } from "@/lib/vendors";

export function Vendors() {
  return (
    <section id="vendors" className="scroll-mt-24 border-t border-white/10 bg-black px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#ff7ac6]">On site</p>
          <h1 className="mt-3 font-display text-5xl leading-none text-white sm:text-6xl">Vendors & partners</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
            Food, sweets, kids activities, merch, and the 21+ beer stop. Find them on the festival grounds.
          </p>
        </div>
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {vendors.map((vendor) => (
            <li key={vendor.number} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <img
                src={encodeURI(vendor.logo)}
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl bg-black object-contain sm:h-20 sm:w-20"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff7ac6]">
                  {vendor.number} · {vendor.category}
                </p>
                <h2 className="mt-1 font-display text-3xl leading-none text-white">{vendor.name}</h2>
                <p className="mt-2 text-sm italic text-white/55">{vendor.slogan}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {vendor.offerings.map((item) => (
                    <li key={item} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/80">
                      {item}
                    </li>
                  ))}
                </ul>
                {vendor.note ? <p className="mt-3 text-xs text-white/45">{vendor.note}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
