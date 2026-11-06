import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CopyHandle } from "@/components/CopyHandle";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { event } from "@/lib/content";
import { INSTAGRAM_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Sponsorships | MCC Turn It Up",
  description: "Sponsor MCC Turn It Up. Cash and in-kind tiers for the Chicago community festival.",
};

const team = [
  ["Cesar Ornelas Lugo", "Scrum Master"],
  ["Sarvar Mirzakhmedov", "Board Owner"],
  ["Selbi Gurbanova", "Team member"],
  ["Kyongsim Chang", "Team member"],
  ["Nyambayar Khurelbaatar", "Team member"],
];

function Tbc() {
  return (
    <span className="ml-2 inline-block border border-dashed border-[#ffc857] px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-[#ffc857]">
      To be confirmed
    </span>
  );
}

export default function SponsorshipPage() {
  return (
    <>
      <Header solid />
      <main className="bg-black pt-24 text-white">
        <section className="border-b border-white/10">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <img
                  src="/sponsor/logo.jpg"
                  alt="MCC Turn It Up logo"
                  className="h-14 w-14 rounded-full border border-white/15 object-cover"
                />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                  MuzzFund · Sponsorships
                </p>
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ff7ac6]">
                Sponsor the festival
              </p>
              <h1 className="mt-3 max-w-xl text-balance font-display text-[clamp(2.6rem,8vw,4.5rem)] leading-[0.9]">
                Put your brand in front of the crowd at MCC Turn It Up
              </h1>
              <p className="mt-5 max-w-xl text-lg text-white/70">
                A one-day EDM, music and community festival in Chicago. Pick a sponsorship tier, pay in cash or in kind, and help us bring the night to life.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
                <li className="rounded-full border border-white/15 px-3 py-2">1 day</li>
                <li className="rounded-full border border-white/15 px-3 py-2">{event.time}</li>
                <li className="rounded-full border border-white/15 px-3 py-2">500–700 guests</li>
                <li className="rounded-full border border-white/15 px-3 py-2">{event.place}</li>
                <li className="rounded-full border border-white/15 px-3 py-2">{event.date}</li>
              </ul>
            </div>
            <img
              src="/sponsor/poster.jpg"
              alt="MCC Turn It Up festival poster: a crowd in front of a neon-lit stage with the Chicago skyline"
              className="mx-auto w-full max-w-md rounded-2xl border border-white/10 shadow-[0_30px_80px_-24px_rgba(255,45,149,0.55)]"
            />
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c4b5fd]">Who will be there</p>
            <h2 className="mt-2 font-display text-5xl">Audience overview</h2>
            <p className="mt-4 max-w-2xl text-white/65">
              This is who your brand will reach. Details still waiting on Marketing are marked to be confirmed.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat k="Expected attendance" v="500–700" src="Source: Marketing / festival website" />
              <Stat k="Time on site" v="8 hours" src="12 PM to 8 PM, one day. Source: festival website" />
              <Stat k="Age groups" v={<Tbc />} src="Source: Marketing audience data" />
              <Stat k="Where guests come from" v={<>Chicago area <Tbc /></>} src="Source: Marketing audience data" />
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c4b5fd]">Sponsorship tiers</p>
            <h2 className="mt-2 font-display text-5xl">Three ways to sponsor</h2>
            <p className="mt-4 max-w-2xl text-white/65">
              Prices are in US dollars. Every tier can be paid in cash or with goods and services. Prices stay a draft until Finance confirms them. <Tbc />
            </p>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              <Tier
                tag="Warm-up"
                name="Opener"
                price="$250"
                items={[
                  "Logo on the festival website sponsor list",
                  "Thank-you post on @mcc.turnitup",
                  "Name on the sponsor board at the entrance",
                ]}
                inKind="Water, snacks, or giveaway items worth about $250"
              />
              <Tier
                tag="Peak hour"
                name="Main Stage"
                price="$500"
                items={[
                  "Everything in Opener",
                  "Logo on the main stage banner",
                  "A booth or table space at the festival",
                  "One shout-out from the stage",
                ]}
                inKind="Sound, lighting, or staging gear worth about $500"
              />
              <Tier
                featured
                tag="The drop"
                name="Headliner"
                price="$1,250"
                items={[
                  "Everything in Main Stage",
                  "Biggest logo on the poster and the stage screens",
                  "Option to sponsor artist fees, with your name shown big",
                  "Your brand named in every festival social post",
                ]}
                inKind="Artist, equipment, or venue support worth about $1,250"
              />
            </div>
            <p className="mt-6 text-sm font-semibold text-white/60">
              One of each tier: <span className="text-lg text-white">$250 + $500 + $1,250 = $2,000</span>
              <span className="ml-3 text-[#ffc857]">Meets Finance&apos;s $2,000 goal</span>
            </p>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c4b5fd]">Special package</p>
            <h2 className="mt-2 font-display text-5xl">Official Shuttle Partner</h2>
            <p className="mt-4 max-w-2xl text-white/65">
              Guests ride to and from the festival on a sponsored shuttle.
            </p>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="font-display text-4xl text-[#ff7ac6]">Windy City Buses</p>
                <p className="mt-2 text-sm text-white/60">Proposed partner. The service details come from the Logistics team.</p>
                <dl className="mt-4 divide-y divide-white/10 text-sm">
                  <Row label="Vehicles"><Tbc /></Row>
                  <Row label="Routes"><Tbc /></Row>
                  <Row label="Operating hours">Around the festival hours, {event.time} <Tbc /></Row>
                  <Row label="Stops"><Tbc /></Row>
                </dl>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-display text-3xl">What the partner gets</h3>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-white/75">
                  <li>The title &quot;Official Shuttle Partner&quot;</li>
                  <li>Logo on every shuttle stop sign</li>
                  <li>&quot;Shuttle by Windy City Buses&quot; on the festival website and map</li>
                  <li>A thank-you from the stage and on @mcc.turnitup</li>
                </ul>
                <p className="mt-5 border-l-2 border-[#ffc857] pl-3 text-sm text-white/60">
                  Guest emails for ads are not included. We are checking with Marketing if this is allowed. <Tbc />
                </p>
              </article>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c4b5fd]">Contact</p>
            <h2 className="mt-2 font-display text-5xl">Talk to our sponsorship team</h2>
            <p className="mt-4 max-w-2xl text-white/65">
              We are the MuzzFund team at {event.host}. Reach out on Instagram and we will reply with a custom proposal for your brand.
            </p>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <ul className="divide-y divide-white/10">
                {team.map(([name, role]) => (
                  <li key={name} className="flex flex-wrap justify-between gap-2 py-3">
                    <span>{name}</span>
                    <span className="text-sm text-white/50">{role}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span>
                    @mcc.turnitup <span className="block text-xs text-white/45">Instagram</span>
                  </span>
                  <CopyHandle value="@mcc.turnitup" />
                </div>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 font-semibold hover:border-[#ff2d95]"
                >
                  Open Instagram
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ k, v, src }: { k: string; v: ReactNode; src: string }) {
  return (
    <article className="flex min-h-40 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">{k}</p>
      <p className="mt-3 font-display text-4xl leading-none">{v}</p>
      <p className="mt-auto pt-4 text-xs text-white/45">{src}</p>
    </article>
  );
}

function Tier({
  tag,
  name,
  price,
  items,
  inKind,
  featured = false,
}: {
  tag: string;
  name: string;
  price: string;
  items: string[];
  inKind: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`flex flex-col rounded-2xl border p-6 ${featured ? "border-[#ff2d95] shadow-[0_0_0_1px_#ff2d95]" : "border-white/10"} bg-white/[0.03]`}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ff7ac6]">{tag}</p>
      <h3 className="mt-2 font-display text-4xl">{name}</h3>
      <p className="mt-3 font-display text-5xl">
        {price} <span className="text-base tracking-normal text-white/45">cash</span>
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/75">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-5 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm">
        <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#c4b5fd]">Or in kind</span>
        {inKind}
      </p>
    </article>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
      <dt className="text-white/45">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
