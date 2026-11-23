"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ForecastChart } from "@/components/ForecastChart";
import { FORECAST_COLORS } from "@/components/ForecastColors";
import { solidButtonClass } from "@/lib/styles";
import { money } from "@/lib/tickets";
import type { ForecastInput } from "@/lib/payments/models/ForecastRequest";
import type { ForecastResult, ForecastService } from "@/lib/payments/services/ForecastService";

type Assumptions = ReturnType<ForecastService["assumptions"]>;

const startInput: ForecastInput = { earlyBird: 80, general: 120, discounted: 20, atDoor: 60, vendors: 6 };
const zeroInput: ForecastInput = { earlyBird: 0, general: 0, discounted: 0, atDoor: 0, vendors: 0 };

const fieldClass =
  "w-20 rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-right text-sm text-white outline-none focus:border-[#ff2d95]";

// A whole-number field that lets you clear it and type freely: no stuck leading "0".
function NumberField({ id, value, max, onCommit, className }: { id: string; value: number; max: number; onCommit: (value: number) => void; className: string }) {
  const [draft, setDraft] = useState<string | null>(null); // null = not being edited, show the real value
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={draft ?? String(value)}
      onFocus={(event) => event.target.select()}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
        const next = digits === "" ? 0 : Math.min(max, Number(digits));
        setDraft(digits === "" ? "" : String(next));
        onCommit(next);
      }}
      onBlur={() => setDraft(null)}
      className={className}
    />
  );
}

export function ForecastDesk() {
  const [assumptions, setAssumptions] = useState<Assumptions | null>(null);
  const [input, setInput] = useState<ForecastInput>(startInput);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const [replayKey, setReplayKey] = useState(0); // bumped by Random so the chart builds itself again

  useEffect(() => {
    fetch("/api/forecast", { cache: "no-store" })
      .then((response) => response.json() as Promise<Assumptions>)
      .then(setAssumptions)
      .catch(() => setError("Could not load the forecast settings. Please reload the page."));
  }, []);

  // Recalculate (on the server, from the prices in the config) a moment after the numbers change.
  useEffect(() => {
    if (!assumptions) return;
    const id = ++requestId.current;
    const timer = window.setTimeout(() => {
      fetch("/api/forecast", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "Request failed");
          return data as ForecastResult;
        })
        .then((data) => {
          if (id !== requestId.current) return; // an older answer arrived late
          setResult(data);
          setError("");
        })
        .catch((reason: Error) => {
          if (id === requestId.current) setError(reason.message);
        });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [input, assumptions]);

  const set = useCallback((key: keyof ForecastInput, value: number) => {
    setInput((current) => ({ ...current, [key]: Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)) }));
  }, []);

  async function randomize() {
    try {
      const response = await fetch("/api/forecast/random", { cache: "no-store" });
      const data = (await response.json()) as ForecastResult;
      if (!response.ok) throw new Error("Request failed");
      requestId.current += 1; // drop any pending recalculation
      setInput(data.input);
      setResult(data);
      setReplayKey((n) => n + 1);
      setError("");
    } catch {
      setError("Could not create a random forecast. Please try again.");
    }
  }

  const fields = assumptions
    ? ([
        { key: "earlyBird", label: "Early Bird", note: `${money(assumptions.prices.earlyBird)} each · online`, max: assumptions.limits.perType },
        { key: "general", label: "General Admission", note: `${money(assumptions.prices.general)} each · online`, max: assumptions.limits.perType },
        {
          key: "discounted",
          label: "General with discount",
          note: `${money(assumptions.prices.discounted)} each · ${assumptions.discount.code} ${assumptions.discount.percent}% off · max ${assumptions.discount.limit}`,
          max: assumptions.limits.discounted,
        },
        { key: "atDoor", label: "At the door", note: `${money(assumptions.prices.atDoor)} each · festival day`, max: assumptions.limits.perType },
        { key: "vendors", label: "Vendors", note: `${money(assumptions.vendorFee)} each, paid to join the event`, max: assumptions.limits.vendors },
      ] as const)
    : [];

  const totals = result?.totals;

  return (
    <main className="mx-auto min-h-screen max-w-[88rem] px-4 py-12 sm:px-8">
      <a href="/" className="text-sm text-white/50 hover:text-white">
        ← Back to the site
      </a>
      <h1 className="mt-4 font-display text-5xl text-white sm:text-6xl">Festival forecast</h1>
      <p className="mt-1 max-w-2xl text-sm text-white/55">
        Set how many tickets and vendors you expect and see what the festival could earn. This is a what-if tool: it does not change real sales.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[24rem_1fr]">
        <section className="order-2 space-y-5 lg:order-1" aria-label="Forecast settings">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap gap-2">
              <button type="button" className={`${solidButtonClass} flex-1`} onClick={randomize} disabled={!assumptions}>
                🎲 Random
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/20 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/80 hover:bg-white/10"
                onClick={() => setInput(zeroInput)}
              >
                Clear
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {fields.map((field) => (
                <div key={field.key}>
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor={`f-${field.key}`} className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="h-3 w-3 rounded-full" style={{ background: FORECAST_COLORS[field.key] }} />
                      {field.label}
                    </label>
                    <NumberField
                      id={`f-${field.key}`}
                      value={input[field.key]}
                      max={field.max}
                      onCommit={(value) => set(field.key, value)}
                      className={fieldClass}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={field.max}
                    value={input[field.key]}
                    aria-label={`${field.label} amount`}
                    onChange={(event) => set(field.key, Number(event.target.value))}
                    className="mt-2 w-full"
                    style={{ accentColor: FORECAST_COLORS[field.key] }}
                  />
                  <p className="text-xs text-white/45">{field.note}</p>
                </div>
              ))}
              {!assumptions && !error ? <p className="text-sm text-white/50">Loading settings…</p> : null}
            </div>
          </div>

          {error ? (
            <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          {totals && result ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-display text-3xl text-white">What we would earn</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <div className="flex justify-between gap-3 font-semibold text-white">
                    <dt>Online tickets</dt>
                    <dd>{money(totals.onlineTickets)}</dd>
                  </div>
                  <p className="text-xs text-white/50">
                    {totals.onlineTicketCount} tickets: {result.tickets.earlyBird.count} Early Bird ({money(result.tickets.earlyBird.revenue)}), {result.tickets.general.count} General (
                    {money(result.tickets.general.revenue)}), {result.tickets.discounted.count} with discount ({money(result.tickets.discounted.revenue)})
                  </p>
                </div>
                <div>
                  <div className="flex justify-between gap-3 font-semibold text-white">
                    <dt>At the door</dt>
                    <dd>{money(totals.doorTickets)}</dd>
                  </div>
                  <p className="text-xs text-white/50">{result.tickets.atDoor.count} tickets × {money(result.tickets.atDoor.unitPrice)}</p>
                </div>
                <div>
                  <div className="flex justify-between gap-3 font-semibold text-white">
                    <dt>Vendors</dt>
                    <dd>{money(totals.vendors)}</dd>
                  </div>
                  <p className="text-xs text-white/50">{result.vendors.count} vendors × {money(result.vendors.fee)}</p>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-white/10 pt-3">
                  <dt className="font-display text-2xl text-white">Total</dt>
                  <dd className="font-display text-4xl text-[#ff7ac6]">{money(totals.grandTotal)}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/55">
                  <span>{totals.attendees} people expected</span>
                  <span>Capacity {totals.capacity}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(totals.capacityUsed * 100)}>
                  <div className={`h-full ${totals.overCapacity ? "bg-rose-400" : "bg-[#ff2d95]"}`} style={{ width: `${Math.min(100, totals.capacityUsed * 100)}%` }} />
                </div>
                {totals.overCapacity ? (
                  <p className="mt-2 text-xs text-rose-300">This is more people than the venue holds ({totals.capacity}).</p>
                ) : null}
              </div>
              <p className="mt-3 text-[11px] text-white/35">Gross revenue, before card processing fees. Seniors and kids are free and not counted.</p>
            </div>
          ) : null}
        </section>

        <section
          className="order-1 h-[64vh] min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#04070f] lg:sticky lg:top-6 lg:order-2 lg:h-[calc(100vh-3rem)] lg:max-h-[46rem]"
          aria-label="Line chart of the forecast"
        >
          {result ? <ForecastChart result={result} replayKey={replayKey} /> : <div className="grid h-full place-items-center text-sm text-white/55">Loading the forecast…</div>}
        </section>
      </div>
    </main>
  );
}
