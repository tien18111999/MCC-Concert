import { event, mapZones } from "@/lib/content";

export function SiteMap() {
  return (
    <section id="map" className="scroll-mt-24 border-t border-white/10 bg-black px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#ff7ac6]">
            Event layout
          </p>
          <h2 className="mt-3 font-display text-5xl leading-none text-white sm:text-6xl">
            Festival site map
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            {event.place} — southeast sports fields, next to the fieldhouse ({event.address})
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-[#160a24] p-4 sm:p-6">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="flex min-h-28 items-end rounded-2xl bg-[#c026d3]/80 p-4 md:col-span-2">
              <p className="font-semibold text-white">Stage & main entrance</p>
            </div>
            <div className="flex min-h-28 items-end rounded-2xl bg-[#fb7185]/80 p-4">
              <p className="font-semibold text-[#2a0a14]">Food court</p>
            </div>
            <div className="flex min-h-28 items-end rounded-2xl bg-[#34d399]/80 p-4">
              <p className="font-semibold text-[#05281a]">Kids zone</p>
            </div>
            <div className="flex min-h-24 items-end rounded-2xl bg-[#fbbf24]/90 p-4 md:col-span-2">
              <p className="font-semibold text-[#2a1d05]">21+ area</p>
            </div>
            <div className="flex min-h-24 items-end rounded-2xl bg-[#60a5fa]/80 p-4">
              <p className="font-semibold text-[#071426]">First aid</p>
            </div>
            <div className="flex min-h-24 items-end rounded-2xl bg-[#67e8f9]/80 p-4">
              <p className="font-semibold text-[#08343a]">Restrooms</p>
            </div>
          </div>
          <p className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-white/40">
            Layout preview · detailed map coming soon
          </p>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          {mapZones.map((zone) => (
            <li key={zone.name} className="flex min-w-0 items-center gap-2 text-white/75">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: zone.color }}
              />
              {zone.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
