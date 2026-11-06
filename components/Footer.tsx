import { JoinButton } from "@/components/Actions";
import { event } from "@/lib/content";
import { INSTAGRAM_URL } from "@/lib/links";
import { solidButtonClass } from "@/lib/styles";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#05020c] px-5 py-14 text-sm text-white/65 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-3xl tracking-wide text-white">MCC Turn It Up</p>
          <p className="mt-3 max-w-xs leading-relaxed">
            Hosted by {event.host}. A neighborhood night of music, food, and the people who live here.
          </p>
          <a href="/staff" className="mt-4 inline-block text-xs text-white/40 underline-offset-2 hover:text-white hover:underline">
            Staff waitlist portal
          </a>
        </div>
        <div>
          <p className="font-semibold text-white">Contact</p>
          <ul className="mt-3 space-y-2">
            <li>
              <a className="hover:text-white" href={`mailto:${event.email}`}>
                {event.email}
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="tel:+13122369000">
                {event.phone}
              </a>
            </li>
            <li>{event.city}</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Updates</p>
          <p className="mt-3 max-w-xs leading-relaxed">
            Lineup notes and the ticket drop land on Instagram first.
          </p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-white transition hover:border-[#ff2d95] hover:text-[#ff9ad0]"
          >
            @mcc.turnitup
          </a>
        </div>
        <div>
          <p className="font-display text-4xl leading-none text-white">Be the first to know</p>
          <JoinButton className={`${solidButtonClass} mt-5`}>Sign up for updates</JoinButton>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-xs text-white/40">
        © {new Date().getFullYear()} {event.host}. All rights reserved.
      </p>
    </footer>
  );
}
