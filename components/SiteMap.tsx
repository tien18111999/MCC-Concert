import { event } from "@/lib/content";

const maps = [
  {
    src: "/extra/1.jpg",
    title: "Festival safety map",
    caption: "Emergency exits, first aid, security, assembly points, and the emergency lane.",
  },
  {
    src: "/extra/2.jpg",
    title: "Parking, drop-off, and getting there",
    caption: "Attendee parking, the S3 shuttle stop, load-in, and CTA stops around Columbus Park.",
  },
  {
    src: "/extra/3.jpg",
    title: "Parking and drop-off",
    caption: "One-way lot: enter at the north end and leave at the south end.",
  },
];

const tripPlanner = encodeURI("/extra/Columbus Park Festival – Plan Your Trip.html");

export function SiteMap() {
  return (
    <section id="map" className="scroll-mt-24 border-t border-white/10 bg-black px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#ff7ac6]">Event layout</p>
          <h1 className="mt-3 font-display text-5xl leading-none text-white sm:text-6xl">Festival site map</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            {event.place} — southeast sports fields, next to the fieldhouse ({event.address})
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {maps.map((map) => (
            <figure key={map.src} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#160a24]">
              <img src={encodeURI(map.src)} alt={map.title} className="h-auto w-full" />
              <figcaption className="px-4 py-4 sm:px-6">
                <p className="font-semibold text-white">{map.title}</p>
                <p className="mt-1 text-sm text-white/55">{map.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ff7ac6]">Plan your trip</p>
          <h2 className="mt-2 font-display text-4xl text-white">Free shuttle by Windy City Buses</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            Gates open at 12:00 PM. Guest buses run to the Main Entrance on Central Ave. The lot is one-way:
            enter at the north end and exit at the south end. Ride-share drop-off is stop-and-go at the S3 curb.
          </p>
          <ul className="mt-6 grid gap-3 text-sm text-white/80 sm:grid-cols-3">
            <li className="rounded-2xl border border-white/10 px-4 py-3">
              <p className="font-semibold text-white">S1 · Union Station</p>
              <p className="mt-1 text-white/55">Every 30 minutes, 10:30 AM–7:30 PM. About 30 minutes to the park.</p>
            </li>
            <li className="rounded-2xl border border-white/10 px-4 py-3">
              <p className="font-semibold text-white">S2 · Austin Blue Line</p>
              <p className="mt-1 text-white/55">Every 30 minutes, 10:48 AM–7:48 PM. About 12 minutes to the park.</p>
            </li>
            <li className="rounded-2xl border border-white/10 px-4 py-3">
              <p className="font-semibold text-white">Home from S3</p>
              <p className="mt-1 text-white/55">Last bus leaves the park at 9:32 PM.</p>
            </li>
          </ul>
          <a
            href={tripPlanner}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-full bg-[#ff2d95] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ff4aa8]"
          >
            Open the trip planner
          </a>
        </div>
      </div>
    </section>
  );
}
