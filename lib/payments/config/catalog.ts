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

export type ForecastConfig = {
  discountCode: string; // which discount code the forecast's "with discount" tickets use
  maxVendors: number;
  // Used by the forecast's Random button: always this many tickets in total, split at random
  // between Early Bird, General, discounted and door. Ranges are [min, max].
  random: {
    totalTickets: number;
    discounted: [number, number];
    vendors: [number, number];
  };
};

export type Catalog = {
  eventDate: Date;
  doorPrice: number; // price at the gate on festival day (not sold online)
  tickets: TicketConfig[];
  discountCodes: Record<string, DiscountRule>;
  fee: { percent: number; fixedCents: number }; // simulated processor cost: recorded, not added to the customer's total
  maxDonationCents: number;
  vendorFee: number; // cents each vendor pays to be part of the event
  capacity: number; // most people the venue holds (the festival expects 500 to 700)
  forecast: ForecastConfig;
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
    vendorFee: 50000,
    capacity: 700,
    forecast: {
      discountCode: "MCCVIBES",
      maxVendors: 30,
      random: {
        totalTickets: 500,
        discounted: [10, 50],
        vendors: [5, 12],
      },
    },
  };
}
