"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { event } from "@/lib/content";
import { solidButtonClass } from "@/lib/styles";
import {
  DISCOUNT_CODES,
  MAX_PER_TYPE,
  cardBrand,
  computeOrder,
  money,
  parseTestDate,
  saleState,
  saleStatus,
  shortDate,
  tickets,
  validateCard,
  type TicketId,
} from "@/lib/tickets";

type Qty = Record<TicketId, number>;
type Receipt = {
  ok: boolean;
  orderId: string;
  transactionId: string;
  date: string;
  payment: string;
  tickets: string;
  discount: string;
  total: string;
};

const emptyQty = (): Qty => ({ early: 0, general: 0, senior: 0 });

const fieldClass =
  "w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#ff2d95]";

function randomHex(bytes: number) {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("");
}

function formatDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function TicketDesk() {
  const [qty, setQty] = useState<Qty>(emptyQty);
  const [codeInput, setCodeInput] = useState("");
  const [applied, setApplied] = useState<{ code: string; percent: number } | null>(null);
  const [codeMessage, setCodeMessage] = useState("");
  const [codeOk, setCodeOk] = useState(false);
  const [donation, setDonation] = useState("");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "result">("form");
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [cardError, setCardError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [used, setUsed] = useState<Record<string, number>>({});

  useEffect(() => {
    const testDate = parseTestDate(new URLSearchParams(window.location.search).get("date"));
    if (testDate) setNow(testDate);
    const codes = Object.keys(DISCOUNT_CODES);
    Promise.all(
      codes.map(async (code) => {
        const response = await fetch(`/api/discount?code=${code}`);
        if (!response.ok) return [code, 0] as const;
        const data = (await response.json()) as { used?: number };
        return [code, data.used ?? 0] as const;
      }),
    )
      .then((pairs) => setUsed(Object.fromEntries(pairs)))
      .catch(() => undefined);
  }, []);

  const donationCents = useMemo(() => {
    const value = Number.parseFloat(donation);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.round(Math.min(value, 1000) * 100);
  }, [donation]);

  const order = useMemo(
    () =>
      computeOrder({
        qty,
        code: applied?.code ?? null,
        used: applied ? (used[applied.code] ?? 0) : 0,
        donationCents,
        now,
      }),
    [applied, donationCents, now, qty, used],
  );

  const codeNotice = useMemo(() => {
    if (!applied) return codeMessage;
    const rule = DISCOUNT_CODES[applied.code];
    const names = rule.appliesTo
      .map((id) => tickets.find((ticket) => ticket.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    let text = `Code ${applied.code} applied: ${rule.percent}% off ${names} tickets.`;
    if (order.eligibleQty > order.discountedQty) {
      text += ` Only ${order.discountedQty} of your ${order.eligibleQty} tickets get the discount.`;
    } else if (order.eligibleQty === 0) {
      text += ` Add ${names} tickets to use it.`;
    }
    return text;
  }, [applied, codeMessage, order.discountedQty, order.eligibleQty]);

  const setCount = (id: TicketId, next: number) => {
    const ticket = tickets.find((item) => item.id === id);
    if (!ticket || saleState(ticket, now) !== "onsale") return;
    setQty((current) => ({ ...current, [id]: Math.max(0, Math.min(MAX_PER_TYPE, next)) }));
  };

  const applyCode = () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) {
      setApplied(null);
      setCodeMessage("");
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(DISCOUNT_CODES, code)) {
      setApplied(null);
      setCodeOk(false);
      setCodeMessage("That code is not valid.");
      return;
    }
    const rule = DISCOUNT_CODES[code];
    const onSale = tickets.some((ticket) => rule.appliesTo.includes(ticket.id) && saleState(ticket, now) === "onsale");
    if (!onSale) {
      const first = tickets.find((ticket) => rule.appliesTo.includes(ticket.id));
      setApplied(null);
      setCodeOk(false);
      setCodeMessage(
        first && saleState(first, now) === "upcoming"
          ? `${code} can be used once ${first.name} goes on sale (${shortDate(first.from)}).`
          : `${code} is no longer available.`,
      );
      return;
    }
    if (rule.limit - (used[code] ?? 0) <= 0) {
      setApplied(null);
      setCodeOk(false);
      setCodeMessage(`Sorry, all ${rule.limit} ${code} discounts have been used.`);
      return;
    }
    setApplied({ code, percent: rule.percent });
    setCodeOk(true);
    setCodeMessage("");
  };

  const reset = () => {
    setQty(emptyQty());
    setApplied(null);
    setCodeInput("");
    setCodeMessage("");
    setDonation("");
    setCard({ name: "", number: "", expiry: "", cvc: "" });
  };

  const finish = async (paidWithCard: { brand: string; last4: string; declined: boolean } | null) => {
    const now = new Date();
    const ok = !paidWithCard?.declined;
    if (ok && applied && order.discountedQty > 0) {
      try {
        const response = await fetch("/api/discount", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code: applied.code, count: order.discountedQty }),
        });
        if (response.ok) {
          const data = (await response.json()) as { used?: number };
          if (typeof data.used === "number") {
            setUsed((current) => ({ ...current, [applied.code]: data.used as number }));
          }
        }
      } catch {
        /* The receipt still shows. The shared count updates on the next successful order. */
      }
    }
    setReceipt({
      ok,
      orderId: `MCC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${randomHex(3).toUpperCase()}`,
      transactionId: `txn_${randomHex(8)}`,
      date: formatDate(now),
      payment: paidWithCard ? `${paidWithCard.brand} ending ${paidWithCard.last4}` : "None (free order)",
      tickets: order.lines.map((line) => `${line.quantity} × ${line.ticket.name}`).join(", "),
      discount:
        order.discountedQty > 0 && applied
          ? `${applied.code}: −${money(order.discount)} (${order.discountedQty} ticket${order.discountedQty === 1 ? "" : "s"})`
          : "",
      total: ok ? money(order.total) : money(0),
    });
    setStep("result");
    if (ok) reset();
  };

  const startPay = () => {
    if (order.lines.length === 0) return;
    setCardError("");
    if (order.total === 0) {
      setOpen(true);
      setStep("processing");
      window.setTimeout(() => finish(null), 1500);
      return;
    }
    setStep("form");
    setOpen(true);
  };

  const submitCard = (formEvent: FormEvent) => {
    formEvent.preventDefault();
    const result = validateCard(card);
    if ("error" in result) {
      setCardError(result.error);
      return;
    }
    setCardError("");
    setStep("processing");
    const snapshot = result;
    window.setTimeout(() => finish(snapshot), 1500);
  };

  return (
    <>
      <section className="border-b border-white/10 bg-black px-5 pb-16 pt-28 text-center sm:px-8">
        <p className="text-balance text-xs font-bold uppercase tracking-[0.14em] text-[#ff7ac6] sm:tracking-[0.28em]">Tickets from $8 · Kids under 12 free</p>
        <h1 className="mt-4 font-display text-5xl sm:text-7xl">Get your festival tickets</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
          Every ticket helps support our community fund and keeps future neighborhood events thriving.
        </p>
        <p className="mx-auto mt-6 max-w-xl text-sm text-white/55">
          <span className="block sm:inline">
            {event.date} · {event.time}
          </span>
          <span className="mx-2 hidden text-white/25 sm:inline">·</span>
          <span className="mt-1 block sm:mt-0 sm:inline">
            {event.place}, {event.address}
          </span>
        </p>
      </section>

      <section id="buy" className="mx-auto grid max-w-6xl gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
          <h2 className="font-display text-4xl">Choose your tickets</h2>
          <p className="mt-1 text-sm text-white/50">Select how many of each ticket you need (max 10 per type).</p>
          <p className="mt-4 rounded-xl border border-sky-300/30 bg-sky-400/10 px-4 py-3 text-sm text-white/85">{saleStatus(now)}</p>
          <ul className="mt-2 divide-y divide-white/10">
            {tickets.map((ticket) => {
              const state = saleState(ticket, now);
              const windowLabel = `Online ${shortDate(ticket.from)} – ${shortDate(new Date(ticket.until.getFullYear(), ticket.until.getMonth(), ticket.until.getDate() - 1))}`;
              return (
                <li key={ticket.id} className={`flex flex-wrap items-center justify-between gap-4 py-5 ${state === "onsale" ? "" : "opacity-60"}`}>
                  <div>
                    <p className="text-lg font-semibold">{ticket.name}</p>
                    <p className="text-sm text-white/50">
                      {ticket.note} · {windowLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-display text-3xl text-[#ff7ac6]">{ticket.price === 0 ? "Free" : money(ticket.price)}</p>
                    {state === "onsale" ? (
                      <div className="flex items-center rounded-full border border-white/15">
                        <button
                          type="button"
                          className="h-10 w-10 text-lg"
                          aria-label={`Remove one ${ticket.name}`}
                          onClick={() => setCount(ticket.id, qty[ticket.id] - 1)}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{qty[ticket.id]}</span>
                        <button
                          type="button"
                          className="h-10 w-10 text-lg"
                          aria-label={`Add one ${ticket.name}`}
                          onClick={() => setCount(ticket.id, qty[ticket.id] + 1)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="rounded-full bg-white/10 px-3 py-2 text-center text-xs font-bold text-white/55">
                        {state === "upcoming" ? `On sale ${shortDate(ticket.from)}` : "Sale ended"}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 rounded-xl border border-[#ffc857]/30 bg-[#ffc857]/10 p-4 text-sm text-white/80">
            <p className="font-semibold text-white">Please note</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Kids under 12 get in free. No ticket needed; age is verified at the entrance.</li>
              <li>Volunteers get in free. No ticket needed; check in with festival staff at the entrance.</li>
              <li>At the door tickets are $18, available at the gate on festival day. Buy online to save.</li>
            </ul>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-white/10 bg-[#120818] p-5 sm:p-7 lg:sticky lg:top-28">
          <h2 className="font-display text-4xl">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            {order.lines.length === 0 ? (
              <p className="text-white/40">No tickets selected yet.</p>
            ) : (
              order.lines.map((line) => (
                <p key={line.ticket.id} className="flex justify-between gap-3">
                  <span>
                    {line.quantity} × {line.ticket.name}
                  </span>
                  <span>{line.gross === 0 ? "Free" : money(line.gross)}</span>
                </p>
              ))
            )}
          </div>
          <label htmlFor="discount" className="mt-5 block text-xs font-semibold uppercase tracking-wide text-white/55">
            Discount code
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="discount"
              value={codeInput}
              onChange={(input) => setCodeInput(input.target.value.toUpperCase())}
              onKeyDown={(input) => {
                if (input.key === "Enter") applyCode();
              }}
              placeholder="Enter code"
              className={fieldClass}
            />
            <button type="button" className="rounded-lg bg-white/10 px-4 text-sm font-bold" onClick={applyCode}>
              Apply
            </button>
          </div>
          <p className={`mt-1.5 min-h-4 text-xs ${applied || codeOk ? "text-emerald-300" : "text-rose-300"}`}>{codeNotice}</p>
          <label htmlFor="donation" className="mt-3 block text-xs font-semibold uppercase tracking-wide text-white/55">
            Add a donation to the community fund (optional)
          </label>
          <input
            id="donation"
            type="number"
            min="0"
            max="1000"
            step="1"
            value={donation}
            onChange={(input) => setDonation(input.target.value)}
            placeholder="0"
            className={`${fieldClass} mt-2`}
          />
          <dl className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-white/55">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
            <div className="flex justify-between text-emerald-300"><dt>Discount</dt><dd>−{money(order.discount)}</dd></div>
            <div className="flex justify-between"><dt className="text-white/55">Donation</dt><dd>{money(order.donation)}</dd></div>
            <div className="flex justify-between border-t border-white/10 pt-2 font-display text-3xl"><dt>Total</dt><dd>{money(order.total)}</dd></div>
          </dl>
          <button
            type="button"
            disabled={order.lines.length === 0}
            className={`${solidButtonClass} mt-5 w-full disabled:cursor-not-allowed disabled:bg-white/15`}
            onClick={startPay}
          >
            {order.lines.length && order.total === 0 ? "Get free tickets" : `Pay ${order.total ? money(order.total) : ""}`.trim()}
          </button>
          <p className="mt-2 text-center text-[11px] text-white/40">Demo checkout. No real charge is made.</p>
        </aside>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20 sm:px-8">
        <h2 className="text-center font-display text-5xl">Good to know</h2>
        <div className="mt-6 space-y-3">
          <Faq q="When can I buy Early Bird or General tickets?">
            Early Bird tickets ($8) are sold online from May 12 to May 28, 2027. General Admission ($15) is sold online from May 29 to June 11. The two are never on sale at the same time. Seniors are free during the online sale. On festival day, tickets are $18 at the gate. Code MCCVIBES takes 30% off General Admission for the first 50 tickets.
          </Faq>
          <Faq q="Do kids need a ticket?">
            No. Children under 12 get in free and don&apos;t need a ticket. Their age is verified at the festival entrance.
          </Faq>
          <Faq q="Are volunteers free?">
            Yes. Registered volunteers get free entry and don&apos;t need a ticket; just check in with staff at the entrance.{" "}
            <a className="text-[#ff7ac6] underline" href="/volunteer">Become a volunteer</a>.
          </Faq>
          <Faq q="Will alcohol be served?">
            There is a fenced 21+ Beer Area on site. Please bring a valid ID.
          </Faq>
          <Faq q="Is the venue accessible?">
            ADA-compliant restrooms are available, and staff at the First Aid & Info HQ can help with any needs.
          </Faq>
          <Faq q="Who do I contact with questions?">
            Email {event.email} or call {event.phone}.
          </Faq>
        </div>
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 p-3 sm:place-items-center sm:p-4" role="presentation" onClick={() => step !== "processing" && setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pay-title"
            className="max-h-[92svh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#120818] p-5 sm:p-6"
            onClick={(click) => click.stopPropagation()}
          >
            {step === "form" ? (
              <form onSubmit={submitCard}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff7ac6]">Demo checkout</p>
                    <h2 id="pay-title" className="font-display text-4xl">Pay {money(order.total)}</h2>
                  </div>
                  <button type="button" className="text-2xl leading-none" aria-label="Close" onClick={() => setOpen(false)}>
                    ×
                  </button>
                </div>
                <p className="mt-2 text-xs text-white/45">Card details are never sent or saved. Only the brand and last 4 digits are shown on the receipt.</p>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-white/55" htmlFor="card-name">Name on card</label>
                <input id="card-name" autoComplete="cc-name" value={card.name} onChange={(input) => setCard({ ...card, name: input.target.value })} className={`${fieldClass} mt-1`} />
                <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-white/55" htmlFor="card-number">Card number</label>
                <input
                  id="card-number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={card.number}
                  onChange={(input) => {
                    const digits = input.target.value.replace(/\D/g, "").slice(0, 19);
                    setCard({ ...card, number: digits.replace(/(.{4})/g, "$1 ").trim() });
                  }}
                  className={`${fieldClass} mt-1`}
                />
                <p className="mt-1 text-xs text-white/40">{cardBrand(card.number.replace(/\D/g, ""))}</p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/55" htmlFor="card-exp">Expiry</label>
                    <input
                      id="card-exp"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      value={card.expiry}
                      onChange={(input) => {
                        const digits = input.target.value.replace(/\D/g, "").slice(0, 4);
                        setCard({ ...card, expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits });
                      }}
                      className={`${fieldClass} mt-1`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/55" htmlFor="card-cvc">CVC</label>
                    <input
                      id="card-cvc"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={card.cvc}
                      onChange={(input) => setCard({ ...card, cvc: input.target.value.replace(/\D/g, "").slice(0, 4) })}
                      className={`${fieldClass} mt-1`}
                    />
                  </div>
                </div>
                {cardError ? <p className="mt-3 text-sm text-rose-300">{cardError}</p> : null}
                <button type="submit" className={`${solidButtonClass} mt-5 w-full`}>Pay {money(order.total)}</button>
              </form>
            ) : null}
            {step === "processing" ? (
              <p className="py-10 text-center text-sm text-white/70">Processing payment…</p>
            ) : null}
            {step === "result" && receipt ? (
              <div>
                <h2 id="pay-title" className="font-display text-4xl">{receipt.ok ? "Payment successful" : "Payment declined"}</h2>
                <p className="mt-2 text-sm text-white/65">
                  {receipt.ok
                    ? "Thank you. Your tickets are confirmed. Please keep your order ID for entry."
                    : "Your card was declined. No money was charged. Please try a different card."}
                </p>
                <dl className="mt-4 space-y-2 text-sm">
                  <ReceiptRow k="Order ID" v={receipt.orderId} />
                  <ReceiptRow k="Transaction ID" v={receipt.transactionId} />
                  <ReceiptRow k="Date" v={receipt.date} />
                  <ReceiptRow k="Tickets" v={receipt.tickets} />
                  {receipt.discount ? <ReceiptRow k="Discount" v={receipt.discount} /> : null}
                  <ReceiptRow k="Payment" v={receipt.payment} />
                  <ReceiptRow k="Total" v={receipt.total} />
                </dl>
                <button
                  type="button"
                  className={`${solidButtonClass} mt-5 w-full`}
                  onClick={() => {
                    if (receipt.ok) setOpen(false);
                    else {
                      setCard((current) => ({ ...current, number: "" }));
                      setStep("form");
                    }
                  }}
                >
                  {receipt.ok ? "Done" : "Try again"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
      <summary className="cursor-pointer font-semibold">{q}</summary>
      <p className="mt-3 text-sm leading-relaxed text-white/65">{children}</p>
    </details>
  );
}

function ReceiptRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-white/45">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  );
}
