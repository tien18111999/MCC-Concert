"use client";

import { FormEvent, useEffect, useId, useState } from "react";

const affiliations = [
  "Current MCC Student",
  "MCC Alumni",
  "Faculty / Staff",
  "External / Community Volunteer",
] as const;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-white outline-none placeholder:text-white/30";

export function Volunteer() {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

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

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setAffiliation("");
    setStudentId("");
    setError("");
    setDone(false);
    setPending(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, affiliation, studentId }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save your registration.");
        setPending(false);
        return;
      }
      setDone(true);
      setPending(false);
    } catch {
      setError("Could not save your registration. Please try again.");
      setPending(false);
    }
  }

  return (
    <section className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#2a0a3e] via-[#14081f] to-[#3a0d32] p-8 sm:p-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">
              Get involved
            </p>
            <h1 className="mt-3 font-display text-5xl leading-none text-white sm:text-6xl">
              Become a festival volunteer
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
              Help make the MCC Community Music Festival an easy day to be part of.
              Stage support, guest welcome, or the kids zone — the neighborhood shows up because people do.
            </p>
          </div>
          <div className="w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                reset();
                setOpen(true);
              }}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#ff2d95] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(255,45,149,0.35)] transition hover:bg-[#ff4aa8] md:w-auto"
            >
              Volunteer
            </button>
            <p className="mt-3 text-center text-xs text-white/45 md:text-left">
              Opens the volunteer registration form
            </p>
          </div>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-black/75 p-3 sm:place-items-center sm:p-4"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#140a22] p-6 sm:p-8"
            onClick={(click) => click.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff7ac6]">
                  Volunteer registration
                </p>
                <h2 id={titleId} className="mt-2 font-display text-4xl text-white">
                  Join the team
                </h2>
              </div>
              <button type="button" className="text-2xl leading-none text-white/70" aria-label="Close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Your enthusiasm helps make this musical night a success. The committee uses this form to assign a role and shift.
            </p>

            {done ? (
              <p className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                Thank you. The team will review your registration and reach out by email or phone with orientation details.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <label className="block text-sm">
                  <span className="font-medium text-white">Full name</span>
                  <input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className={fieldClass} />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-white">Email address</span>
                  <input required type="email" maxLength={200} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className={fieldClass} />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-white">Phone number</span>
                  <span className="mt-1 block text-xs text-white/45">Used for quick coordination and day-of-event updates.</span>
                  <input required type="tel" minLength={7} maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" className={fieldClass} />
                </label>
                <fieldset>
                  <legend className="text-sm font-medium text-white">What is your affiliation with MCC?</legend>
                  <div className="mt-2 space-y-2">
                    {affiliations.map((option) => (
                      <label key={option} className="flex items-center gap-3 text-sm text-white/80">
                        <input
                          type="radio"
                          name="affiliation"
                          required
                          value={option}
                          checked={affiliation === option}
                          onChange={() => setAffiliation(option)}
                          className="accent-[#ff2d95]"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="block text-sm">
                  <span className="font-medium text-white">Student ID (if applicable)</span>
                  <input maxLength={40} value={studentId} onChange={(event) => setStudentId(event.target.value)} className={fieldClass} />
                </label>
                {error ? <p className="text-sm text-rose-300">{error}</p> : null}
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-full bg-[#ff2d95] py-3 text-sm font-semibold text-white transition hover:bg-[#ff4aa8] disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Submit registration"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
