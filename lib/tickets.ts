export const tickets = [
  {
    id: "early",
    name: "Early Bird",
    price: 800,
    note: "Limited-time online price",
    from: new Date(2027, 4, 12),
    until: new Date(2027, 4, 29),
  },
  {
    id: "general",
    name: "General Admission",
    price: 1500,
    note: "Standard festival entry",
    from: new Date(2027, 4, 29),
    until: new Date(2027, 5, 12),
  },
  {
    id: "senior",
    name: "Senior",
    price: 0,
    note: "Free for senior guests",
    from: new Date(2027, 4, 12),
    until: new Date(2027, 5, 12),
  },
] as const;

export type TicketId = (typeof tickets)[number]["id"];
export type Ticket = (typeof tickets)[number];
export type SaleState = "upcoming" | "onsale" | "ended";

export const MAX_PER_TYPE = 10;
export const DOOR_CENTS = 1800;

export type DiscountRule = {
  percent: number;
  appliesTo: readonly TicketId[];
  limit: number;
};

export const DISCOUNT_CODES: Record<string, DiscountRule> = {
  MCCVIBES: { percent: 30, appliesTo: ["general"], limit: 50 },
};

export const DECLINE_TEST_CARD = "4000000000000002";

const USAGE_PREFIX = "mcc-discount-used-";

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

export function parseTestDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function saleState(ticket: Ticket, now: Date): SaleState {
  if (now < ticket.from) return "upcoming";
  if (now >= ticket.until) return "ended";
  return "onsale";
}

export function saleStatus(now: Date) {
  const early = tickets[0];
  const general = tickets[1];
  const earlyLast = shortDate(addDays(general.from, -1));
  if (now < early.from) {
    return `Ticket sales open ${longDate(early.from)}. Early Bird ($8) runs ${shortDate(early.from)} – ${earlyLast}, then General Admission ($15) from ${shortDate(general.from)}.`;
  }
  if (now < general.from) {
    return `Early Bird pricing is on now until ${earlyLast}. General Admission ($15) starts ${shortDate(general.from)}.`;
  }
  if (now < general.until) {
    return `Early Bird has ended. General Admission is on sale online until ${shortDate(addDays(general.until, -1))}.`;
  }
  return "Online ticket sales are closed. Tickets are $18 at the gate on festival day.";
}

export function getDiscountUsed(code: string) {
  try {
    return Math.max(0, Number.parseInt(localStorage.getItem(USAGE_PREFIX + code) || "0", 10) || 0);
  } catch {
    return 0;
  }
}

export function addDiscountUsed(code: string, count: number) {
  try {
    localStorage.setItem(USAGE_PREFIX + code, String(getDiscountUsed(code) + count));
  } catch {
    /* Private browsing can block storage. The demo count stays in this tab. */
  }
}

export type OrderLine = {
  ticket: Ticket;
  quantity: number;
  gross: number;
  discountedQty: number;
  discount: number;
};

export function computeOrder(input: {
  qty: Record<TicketId, number>;
  code: string | null;
  used: number;
  donationCents: number;
  now: Date;
}) {
  const rule = input.code ? DISCOUNT_CODES[input.code] : null;
  let remaining = rule ? Math.max(0, rule.limit - input.used) : 0;
  const lines: OrderLine[] = tickets
    .filter((ticket) => input.qty[ticket.id] > 0 && saleState(ticket, input.now) === "onsale")
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

export type CardCheck =
  | { error: string }
  | { brand: string; last4: string; declined: boolean };

export function validateCard(input: {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
}): CardCheck {
  const name = input.name.trim();
  const num = input.number.replace(/\D/g, "");
  const exp = input.expiry.trim();
  const cvc = input.cvc.trim();
  const brand = cardBrand(num);

  if (name.length < 2) return { error: "Please enter the name on the card." };
  if (num.length < 13 || num.length > 19 || !luhnValid(num)) {
    return { error: "Please enter a valid card number." };
  }

  const match = exp.match(/^(\d{2})\/(\d{2})$/);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 12) {
    return { error: "Please enter the expiry date as MM/YY." };
  }
  const expEnd = new Date(2000 + Number(match[2]), Number(match[1]), 1);
  if (expEnd <= new Date()) return { error: "This card has expired." };

  const cvcLength = brand === "Amex" ? 4 : 3;
  if (!new RegExp(`^\\d{${cvcLength}}$`).test(cvc)) {
    return { error: `Please enter the ${cvcLength}-digit CVC.` };
  }

  return { brand, last4: num.slice(-4), declined: num === DECLINE_TEST_CARD };
}
