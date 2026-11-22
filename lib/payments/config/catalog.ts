// Server-side source of truth for ticket prices, per-order limits, sale windows, discount codes and fees.
// The browser never decides a price: it only sends quantities and a code.
// Money is always in cents. To add a ticket type or a code, edit this file only.

export type TicketConfig = {
  id: string;
  name: string;
  price: number; // cents
  from: Date; // on sale from this day (inclusive)
  until: Date; // until this day (exclusive)
  max: number; // most tickets of this type per order
  note: string;
};

export type DiscountRule = {
  percent: number; // % off each eligible ticket
  appliesTo: string[]; // ticket ids the code works on
  limit: number; // total tickets that can be discounted with this code, across all orders
};

export type Catalog = {
  eventDate: Date;
  doorPrice: number; // price at the gate on festival day (not sold online)
  tickets: TicketConfig[];
  discountCodes: Record<string, DiscountRule>;
  fee: { percent: number; fixedCents: number }; // simulated processor cost: recorded, not added to the customer's total
  maxDonationCents: number;
};

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export function buildCatalog(eventDate = new Date(2027, 5, 12)): Catalog {
  // months are 0-based: 5 = June
  const salesOpen = new Date(eventDate.getFullYear(), eventDate.getMonth() - 1, eventDate.getDate());
  const generalStart = addDays(eventDate, -14);
  const salesClose = eventDate;

  return {
    eventDate,
    doorPrice: 1800,
    tickets: [
      { id: "early", name: "Early Bird", price: 800, from: salesOpen, until: generalStart, max: 10, note: "Limited-time online price" },
      { id: "general", name: "General Admission", price: 1500, from: generalStart, until: salesClose, max: 10, note: "Standard festival entry" },
      { id: "senior", name: "Senior", price: 0, from: salesOpen, until: salesClose, max: 10, note: "Free for senior guests" },
    ],
    discountCodes: {
      MCCVIBES: { percent: 30, appliesTo: ["general"], limit: 50 },
    },
    fee: { percent: 2.9, fixedCents: 30 },
    maxDonationCents: 100000,
  };
}
