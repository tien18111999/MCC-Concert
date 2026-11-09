"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { ExternalButton } from "@/components/Actions";
import { event } from "@/lib/content";
import { navItems, TICKETS_URL } from "@/lib/links";
import { solidButtonClass } from "@/lib/styles";

export function Header({ solid = false }: { solid?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function follow(click: MouseEvent, href: string) {
    click.preventDefault();
    setOpen(false);
    router.push(href);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-40 ${solid ? "border-b border-white/10 bg-black/90 backdrop-blur" : ""}`}
      >
        <div className="pointer-events-auto relative flex h-16 items-center justify-between px-2 sm:h-[4.5rem] sm:px-5">
          <button
            type="button"
            className="relative z-10 grid h-11 w-11 place-items-center text-white"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(true)}
          >
            <span className="flex w-6 flex-col gap-1.5">
              <span className="h-0.5 bg-white" />
              <span className="h-0.5 bg-white" />
              <span className="h-0.5 bg-white" />
            </span>
          </button>

          <a
            href="/"
            aria-label="MCC Turn It Up"
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <img
              src={encodeURI("/extra/Logo Concert.jpg")}
              alt=""
              className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14"
            />
          </a>

          <div className="relative z-10 flex items-center gap-3 sm:gap-5">
            <div className="hidden text-right text-[11px] font-semibold uppercase leading-snug tracking-[0.14em] text-[#ff7ac6] xl:block">
              <p className="whitespace-nowrap">
                {event.city}
                <span className="px-1.5 text-white/35">·</span>
                {event.place}
              </p>
              <p className="whitespace-nowrap">
                {event.date}
                <span className="px-1.5 text-white/35">·</span>
                {event.time}
              </p>
            </div>
            <ExternalButton kind="tickets" className={`${solidButtonClass} shrink-0 px-3 py-2 sm:px-4 sm:py-2.5`}>
              Tickets
            </ExternalButton>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-[min(100%,24rem)] flex-col bg-black text-white shadow-2xl"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-[repeating-linear-gradient(-28deg,#0a0a0a_0_7px,#f4f4f5_7px_12px)]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-[repeating-linear-gradient(-28deg,#0a0a0a_0_7px,#f4f4f5_7px_12px)]" />
            <div className="relative h-16 shrink-0">
              <span className="absolute left-3 top-0 h-14 w-28 bg-[#ff2d95] [clip-path:polygon(0_0,100%_0,0_100%)]" />
              <span className="absolute right-8 top-0 h-14 w-28 bg-[#7c3aed] [clip-path:polygon(100%_0,0_0,100%_100%)]" />
              <button
                type="button"
                className="absolute right-5 top-3 grid h-9 w-9 place-items-center text-2xl text-white"
                onClick={close}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <nav className="relative flex-1 overflow-y-auto px-7 pb-8 sm:px-8" aria-label="Primary">
              <ul className="space-y-4 pt-4">
                {navItems.map((item) => (
                  <li key={item.label}>
                    {item.kind === "section" ? (
                      <a
                        href={item.href}
                        className="block text-lg font-semibold tracking-wide"
                        onClick={(click) => follow(click, item.href)}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <ExternalButton
                        kind="tickets"
                        className="block text-left text-lg font-semibold tracking-wide"
                        onClick={(click) => follow(click, TICKETS_URL)}
                      >
                        {item.label}
                      </ExternalButton>
                    )}
                  </li>
                ))}
              </ul>
              <ExternalButton
                kind="tickets"
                className={`${solidButtonClass} mt-10 w-full py-3.5`}
                onClick={(click) => follow(click, TICKETS_URL)}
              >
                Tickets
              </ExternalButton>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
