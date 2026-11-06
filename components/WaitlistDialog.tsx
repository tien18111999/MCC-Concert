"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { ExternalButton } from "@/components/Actions";
import { useSite } from "@/components/SiteProvider";
import { secondaryButtonClass } from "@/lib/styles";

export function WaitlistDialog() {
  const { waitlistOpen, closeWaitlist } = useSite();
  const titleId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!waitlistOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeWaitlist();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [waitlistOpen, closeWaitlist]);

  if (!waitlistOpen) return null;

  function reset() {
    setName("");
    setEmail("");
    setConsent(false);
    setError("");
    setDone(false);
    setPending(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!consent) {
      setError("Please agree to receive event updates.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, consent }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save your signup.");
        setPending(false);
        return;
      }
      setDone(true);
      setPending(false);
    } catch {
      setError("Could not save your signup. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close waitlist"
        className="absolute inset-0 bg-black/70"
        onClick={() => {
          reset();
          closeWaitlist();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[90svh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-[#140a22] p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
          onClick={() => {
            reset();
            closeWaitlist();
          }}
        >
          <span aria-hidden="true">×</span>
          <span className="sr-only">Close</span>
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ff7ac6]">
          Admission coming soon
        </p>
        <h2 id={titleId} className="mt-2 font-display text-4xl text-white">
          Be the first to know
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          General admission is not on sale yet. Leave your email and we will write when tickets open.
        </p>

        {done ? (
          <p className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            You are on the list. We will email {email} when tickets drop.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-white">Full name</span>
              <input
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                placeholder="Jordan Lee"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none placeholder:text-white/30"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-white">Email</span>
              <input
                required
                type="email"
                maxLength={200}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@email.com"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none placeholder:text-white/30"
              />
            </label>
            <label className="flex items-start gap-3 text-sm text-white/75">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#ff2d95]"
              />
              <span>Email me when tickets and event updates go live.</span>
            </label>
            {error ? (
              <p className="text-sm text-rose-300" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-[#ff2d95] py-3 text-sm font-semibold text-white transition hover:bg-[#ff4aa8] disabled:opacity-60"
            >
              {pending ? "Saving…" : "Join priority waitlist"}
            </button>
          </form>
        )}

        <div className="mt-5 border-t border-white/10 pt-5">
          <ExternalButton kind="tickets" className={`${secondaryButtonClass} w-full`}>
            Buy Tickets
          </ExternalButton>
        </div>
      </div>
    </div>
  );
}
