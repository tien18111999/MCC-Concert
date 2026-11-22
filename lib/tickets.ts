// Client-side helpers for the ticket page: types, formatting, a price PREVIEW and card form checks.
// Ticket prices, per-order limits, sale windows and discount codes are NOT defined here. They live
// in lib/payments/config/catalog.ts and are loaded from /api/catalog. The server re-prices every order.

export type Ticket = {
  id: string;
  name: string;
  price: number; // cents
  max: number; // most per order
  note: string;
  from: Date; // on sale from this day
  until: Date; // until this day (exclusive)
};

export type PublicCatalog = {
  doorPrice: number;
  tickets: (Omit<Ticket, "from" | "until"> & { from: string; until: string })[];
};

export type SaleState = "upcoming" | "onsale" | "ended";

/** Terms of a discount code, as returned by /api/discounts/:code. */
export type AppliedDiscount = {
  code: string;
  percent: number;
  appliesTo: string[];
  remaining: number;
};

/** A saved payment, as returned by POST /api/payments. */
export type PaymentReceipt = {
  orderId: string;
  transactionId: string;
  createdAt: string;
  status: "Approved" | "Declined";
  cardBrand: string;
  cardLast4: string | null;
  lines: { ticketId: string; name: string; quantity: number }[];
  discount: number;
  discountCode: string | null;
  discountedQty: number;
  total: number;
};

export type CardForm = { name: string; number: string; expiry: string; cvc: string };

export function money(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function shortDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export function longDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function parseDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** `?date=YYYY-MM-DD` in the page URL, used to preview a sale phase. */
export function testDateParam(): string | null {
  const value = new URLSearchParams(window.location.search).get("date");
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function parseTestDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

/** Headers for API calls. Forwards the test date so the server applies the same sale phase. */
export function apiHeaders(withJson = false): HeadersInit {
  const headers: Record<string, string> = withJson ? { "content-type": "application/json" } : {};
  const testDate = testDateParam();
  if (testDate) headers["x-simulated-date"] = testDate;
  return headers;
}

export function saleState(ticket: Ticket, now: Date): SaleState {
  if (now < ticket.from) return "upcoming";
  if (now >= ticket.until) return "ended";
  return "onsale";
}

/** Banner text, built from the server's ticket windows. */
export function saleStatus(tickets: Ticket[], doorPrice: number, now: Date) {
  if (tickets.length === 0) return "";
  const salesOpen = new Date(Math.min(...tickets.map((t) => t.from.getTime())));
  const salesClose = new Date(Math.max(...tickets.map((t) => t.until.getTime())));
  const paid = tickets.filter((t) => t.price > 0).sort((a, b) => a.from.getTime() - b.from.getTime());
  const label = (t: Ticket) => `${t.name} (${money(t.price)})`;

  if (now >= salesClose) return `Online ticket sales are closed. Tickets are ${money(doorPrice)} at the gate on festival day.`;
  if (now < salesOpen) {
    return `Ticket sales open ${longDate(salesOpen)}. ` + paid.map((t) => `${label(t)} from ${shortDate(t.from)}`).join(", then ") + ".";
  }
  const parts = [
    ...paid.filter((t) => saleState(t, now) === "onsale").map((t) => `${label(t)} is on sale until ${shortDate(addDays(t.until, -1))}`),
    ...paid.filter((t) => saleState(t, now) === "upcoming").map((t) => `${label(t)} starts ${shortDate(t.from)}`),
  ];
  return parts.length ? parts.join(". ") + "." : "Only free tickets are on sale right now.";
}

export type OrderLine = {
  ticket: Ticket;
  quantity: number;
  gross: number;
  discountedQty: number;
  discount: number;
};

/** Price preview shown while the buyer chooses. The server calculates the real, charged amounts. */
export function computeOrder(input: {
  tickets: Ticket[];
  qty: Record<string, number>;
  discount: AppliedDiscount | null;
  donationCents: number;
  now: Date;
}) {
  const rule = input.discount;
  let remaining = rule ? rule.remaining : 0;
  const lines: OrderLine[] = input.tickets
    .filter((ticket) => (input.qty[ticket.id] ?? 0) > 0 && saleState(ticket, input.now) === "onsale")
    .map((ticket) => {
      const quantity = input.qty[ticket.id];
      const gross = ticket.price * quantity;
      const eligible = Boolean(rule?.appliesTo.includes(ticket.id));
      const discountedQty = eligible ? Math.min(quantity, remaining) : 0;
      remaining -= discountedQty;
      const discount = Math.round((ticket.price * discountedQty * (rule?.percent ?? 0)) / 100);
      return { ticket, quantity, gross, discountedQty, discount };
    });
  const subtotal = lines.reduce((sum, line) => sum + line.gross, 0);
  const discount = lines.reduce((sum, line) => sum + line.discount, 0);
  const discountedQty = lines.reduce((sum, line) => sum + line.discountedQty, 0);
  const eligibleQty = rule
    ? lines.filter((line) => rule.appliesTo.includes(line.ticket.id)).reduce((sum, line) => sum + line.quantity, 0)
    : 0;
  return {
    lines,
    subtotal,
    discount,
    discountedQty,
    eligibleQty,
    donation: input.donationCents,
    total: subtotal - discount + input.donationCents,
  };
}

export function luhnValid(num: string) {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i -= 1) {
    let digit = Number(num[i]);
    if (dbl) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function cardBrand(num: string) {
  if (/^4/.test(num)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "Amex";
  if (/^6(011|5)/.test(num)) return "Discover";
  return "Card";
}

/** Quick checks so typos are caught before sending. The server validates again. */
export function validateCard(input: CardForm): { error: string } | { card: CardForm } {
  const name = input.name.trim();
  const num = input.number.replace(/\D/g, "");
  const exp = input.expiry.trim();
  const cvc = input.cvc.trim();
  const brand = cardBrand(num);

  if (name.length < 2) return { error: "Please enter the name on the card." };
  if (num.length < 13 || num.length > 19 || !luhnValid(num)) return { error: "Please enter a valid card number." };

  const match = exp.match(/^(\d{2})\/(\d{2})$/);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 12) return { error: "Please enter the expiry date as MM/YY." };
  if (new Date(2000 + Number(match[2]), Number(match[1]), 1) <= new Date()) return { error: "This card has expired." };

  const cvcLength = brand === "Amex" ? 4 : 3;
  if (!new RegExp(`^\\d{${cvcLength}}$`).test(cvc)) return { error: `Please enter the ${cvcLength}-digit CVC.` };

  return { card: { name, number: num, expiry: exp, cvc } };
}
