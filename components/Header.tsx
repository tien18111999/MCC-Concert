"use client";

import { useEffect, useState } from "react";
import { ExternalButton } from "@/components/Actions";
import { event } from "@/lib/content";
import { navItems } from "@/lib/links";
import { solidButtonClass } from "@/lib/styles";

export function Header() {
  const [open, setOpen] = useState(false);

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
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
        <div className="pointer-events-auto flex items-start justify-between gap-3 px-3 py-3 sm:px-5 sm:py-4">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center text-white"
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
            href="#top"
            className="absolute left-1/2 top-3 max-w-[42vw] -translate-x-1/2 text-center sm:top-4 sm:max-w-none"
          >
            <span className="block font-display text-2xl leading-none tracking-wide text-white sm:text-4xl">
              MCC Turn It Up
            </span>
          </a>

          <div className="flex items-start gap-3 sm:gap-5">
            <div className="hidden pt-1 text-right text-[11px] font-semibold uppercase leading-4 tracking-wide text-[#ff7ac6] md:block">
              <p>{event.city}</p>
              <p>{event.place}</p>
              <p>{event.date}</p>
              <p>{event.time}</p>
            </div>
            <ExternalButton kind="tickets" className={`${solidButtonClass} px-4 py-2.5`}>
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
            <nav className="relative flex-1 overflow-y-auto px-8 pb-8" aria-label="Primary">
              <ul className="space-y-4 pt-4">
                {navItems.map((item) => (
                  <li key={item.label}>
                    {item.kind === "section" ? (
                      <a
                        href={item.href}
                        className="block text-lg font-semibold tracking-wide"
                        onClick={close}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <ExternalButton
                        kind="tickets"
                        className="block text-left text-lg font-semibold tracking-wide"
                        onClick={close}
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
                onClick={close}
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
