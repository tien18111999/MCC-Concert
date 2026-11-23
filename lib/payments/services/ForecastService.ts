import type { Catalog } from "../config/catalog";
import { ValidationError } from "../errors/AppError";
import type { ForecastInput } from "../models/ForecastRequest";

type TicketLine = { count: number; unitPrice: number; revenue: number };

// Running totals (cents) on one day of the sales period.
export type TimelinePoint = {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "May 29"
  earlyBird: number;
  general: number;
  discounted: number;
  atDoor: number;
  vendors: number;
  total: number;
};

export type ForecastResult = {
  input: ForecastInput;
  timeline: TimelinePoint[];
  phases: { generalOpens: string }; // YYYY-MM-DD, when General Admission goes on sale
  tickets: { earlyBird: TicketLine; general: TicketLine; discounted: TicketLine; atDoor: TicketLine };
  vendors: { count: number; fee: number; revenue: number };
  totals: {
    onlineTicketCount: number;
    onlineTickets: number; // revenue from online tickets (early + general + discounted)
    doorTickets: number; // revenue from tickets sold at the door
    vendors: number; // revenue from vendor fees
    grandTotal: number;
    attendees: number; // ticket holders (online + door)
    capacity: number;
    capacityUsed: number; // 0..n, 1 = full
    overCapacity: boolean;
  };
};

// "What if" calculator. Pure math over the catalog's prices: it never reads or writes real payments
// and never touches the discount counter. Money is in cents; revenue is gross (before processor fees).
export class ForecastService {
  constructor(private readonly catalog: Catalog) {}

  private get early() {
    return this.catalog.tickets.find((t) => t.id === "early")!;
  }

  private get general() {
    return this.catalog.tickets.find((t) => t.id === "general")!;
  }

  private get discount() {
    return this.catalog.discountCodes[this.catalog.forecast.discountCode];
  }

  /** Prices, limits and ranges the forecast page needs. The discount percent is shown on purpose (staff page). */
  assumptions() {
    return {
      prices: {
        earlyBird: this.early.price,
        general: this.general.price,
        discounted: this.general.price - Math.round((this.general.price * this.discount.percent) / 100),
        atDoor: this.catalog.doorPrice,
      },
      discount: { code: this.catalog.forecast.discountCode, percent: this.discount.percent, limit: this.discount.limit },
      vendorFee: this.catalog.vendorFee,
      capacity: this.catalog.capacity,
      limits: { perType: this.catalog.capacity, discounted: this.discount.limit, vendors: this.catalog.forecast.maxVendors },
    };
  }

  calculate(input: ForecastInput): ForecastResult {
    this.validate(input);
    const { prices } = this.assumptions();
    const line = (count: number, unitPrice: number, revenue = count * unitPrice): TicketLine => ({ count, unitPrice, revenue });

    // Same rounding as PricingService: the discount is rounded on the whole line.
    const discountedGross = input.discounted * this.general.price;
    const discountedRevenue = discountedGross - Math.round((discountedGross * this.discount.percent) / 100);

    const tickets = {
      earlyBird: line(input.earlyBird, prices.earlyBird),
      general: line(input.general, prices.general),
      discounted: line(input.discounted, prices.discounted, discountedRevenue),
      atDoor: line(input.atDoor, prices.atDoor),
    };
    const vendorRevenue = input.vendors * this.catalog.vendorFee;
    const onlineTickets = tickets.earlyBird.revenue + tickets.general.revenue + tickets.discounted.revenue;
    const attendees = input.earlyBird + input.general + input.discounted + input.atDoor;

    return {
      input,
      timeline: this.timeline(input, tickets),
      phases: { generalOpens: new Date(Date.UTC(this.general.from.getFullYear(), this.general.from.getMonth(), this.general.from.getDate())).toISOString().slice(0, 10) },
      tickets,
      vendors: { count: input.vendors, fee: this.catalog.vendorFee, revenue: vendorRevenue },
      totals: {
        onlineTicketCount: input.earlyBird + input.general + input.discounted,
        onlineTickets,
        doorTickets: tickets.atDoor.revenue,
        vendors: vendorRevenue,
        grandTotal: onlineTickets + tickets.atDoor.revenue + vendorRevenue,
        attendees,
        capacity: this.catalog.capacity,
        capacityUsed: attendees / this.catalog.capacity,
        overCapacity: attendees > this.catalog.capacity,
      },
    };
  }

  /**
   * How the money builds up day by day, using the sale windows in the catalog. This is a model, not data:
   * Early Bird sells evenly while it is on sale, General (and discounted) evenly once it opens, vendors
   * evenly across the whole period, and door tickets all land on festival day.
   */
  private timeline(input: ForecastInput, tickets: { earlyBird: TicketLine; general: TicketLine; discounted: TicketLine; atDoor: TicketLine }): TimelinePoint[] {
    const day = 24 * 60 * 60 * 1000;
    const dayNumber = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / day);
    const open = dayNumber(this.early.from);
    const generalOpen = dayNumber(this.general.from);
    const eventDay = dayNumber(this.catalog.eventDate);
    const share = (d: number, from: number, to: number) => Math.min(1, Math.max(0, (d - from) / (to - from)));
    const vendorRevenue = input.vendors * this.catalog.vendorFee;

    const points: TimelinePoint[] = [];
    for (let d = open; d <= eventDay; d += 1) {
      const date = new Date(d * day);
      const earlyBird = Math.round(tickets.earlyBird.revenue * share(d, open, generalOpen));
      const general = Math.round(tickets.general.revenue * share(d, generalOpen, eventDay));
      const discounted = Math.round(tickets.discounted.revenue * share(d, generalOpen, eventDay));
      const atDoor = d === eventDay ? tickets.atDoor.revenue : 0;
      const vendors = Math.round(vendorRevenue * share(d, open, eventDay));
      points.push({
        date: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        earlyBird,
        general,
        discounted,
        atDoor,
        vendors,
        total: earlyBird + general + discounted + atDoor + vendors,
      });
    }
    return points;
  }

  /**
   * A random scenario with exactly `forecast.random.totalTickets` tickets (500), split at random between
   * Early Bird, General, discounted and door. Vendors are random inside their range. The user can edit it after.
   */
  random(rng: () => number = Math.random): ForecastResult {
    const { totalTickets, discounted: discountedRange, vendors: vendorRange } = this.catalog.forecast.random;
    const pick = ([min, max]: [number, number]) => min + Math.floor(rng() * (max - min + 1));
    const discounted = Math.min(pick(discountedRange), this.discount.limit, totalTickets);

    // Split what is left between the other three types using random weights (never all zero).
    const rest = totalTickets - discounted;
    const kinds = ["earlyBird", "general", "atDoor"] as const;
    const weights = kinds.map(() => 0.15 + rng());
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const counts = weights.map((w) => Math.floor((w / weightSum) * rest));
    let leftover = rest - counts.reduce((a, b) => a + b, 0);
    for (let i = 0; leftover > 0; i = (i + 1) % counts.length, leftover -= 1) counts[i] += 1;

    const input: ForecastInput = { earlyBird: counts[0], general: counts[1], discounted, atDoor: counts[2], vendors: pick(vendorRange) };
    return this.calculate(input);
  }

  private validate(input: ForecastInput) {
    const { limits } = this.assumptions();
    for (const field of ["earlyBird", "general", "atDoor"] as const) {
      if (input[field] > limits.perType) throw new ValidationError(`"${field}" can be at most ${limits.perType}.`);
    }
    if (input.discounted > limits.discounted) {
      throw new ValidationError(`Only ${limits.discounted} tickets can use the ${this.catalog.forecast.discountCode} discount.`);
    }
    if (input.vendors > limits.vendors) throw new ValidationError(`"vendors" can be at most ${limits.vendors}.`);
  }
}
