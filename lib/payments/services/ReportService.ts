import type { Catalog } from "../config/catalog";
import type { Payment } from "../models/Payment";
import type { PaymentRepository } from "../repositories/PaymentRepository";
import { toDay } from "../utils";

export type ReportFilters = {
  cardBrand?: string;
  status?: string;
  ticketType?: string;
  discountUsed?: string; // "yes" = only orders that used a discount code, "no" = only orders that did not
  from?: string; // YYYY-MM-DD
  to?: string;
};

// Read-only analytics over recorded payments.
// Filters narrow which payments are included. Revenue and ticket counts only use Approved payments;
// the status breakdown counts every payment that matches the filters.
export class ReportService {
  constructor(
    private readonly catalog: Catalog,
    private readonly payments: PaymentRepository,
  ) {}

  async build(filters: ReportFilters = {}) {
    const all = await this.payments.findAll();
    const matching = all.filter((p) => this.matches(p, filters));
    const approved = matching.filter((p) => p.isApproved);

    const sumBy = (list: Payment[], pick: (p: Payment) => number) => list.reduce((s, p) => s + pick(p), 0);
    const revenue = sumBy(approved, (p) => p.total);
    const fees = sumBy(approved, (p) => p.fee);

    return {
      filters,
      options: this.options(all),
      summary: {
        orders: matching.length,
        approvedOrders: approved.length,
        declinedOrders: matching.length - approved.length,
        ticketsSold: sumBy(approved, (p) => p.ticketCount),
        discountedOrders: approved.filter((p) => p.discountedQty > 0).length,
        discountedTickets: sumBy(approved, (p) => p.discountedQty),
        revenue,
        discounts: sumBy(approved, (p) => p.discount),
        donations: sumBy(approved, (p) => p.donation),
        processorFees: fees,
        netRevenue: revenue - fees,
      },
      byCardBrand: this.group(
        approved,
        (p) => p.cardBrand,
        (brand) => ({ brand, orders: 0, tickets: 0, revenue: 0 }),
        (row, p) => {
          row.orders += 1;
          row.tickets += p.ticketCount;
          row.revenue += p.total;
        },
      ),
      byTicketType: this.byTicketType(approved),
      byDiscount: this.group(
        approved,
        (p) => (p.discountedQty > 0 ? "With discount" : "No discount"),
        (label) => ({ label, orders: 0, tickets: 0, revenue: 0 }),
        (row, p) => {
          row.orders += 1;
          row.tickets += p.ticketCount;
          row.revenue += p.total;
        },
      ),
      byDiscountCode: this.group(
        approved.filter((p) => p.discountCode && p.discountedQty > 0),
        (p) => p.discountCode as string,
        (code) => ({ code, orders: 0, discountedTickets: 0, discountAmount: 0 }),
        (row, p) => {
          row.orders += 1;
          row.discountedTickets += p.discountedQty;
          row.discountAmount += p.discount;
        },
      ),
      byStatus: this.group(
        matching,
        (p) => p.status,
        (status) => ({ status, count: 0 }),
        (row) => {
          row.count += 1;
        },
      ),
      overTime: this.overTime(approved),
      recent: [...matching].reverse().slice(0, 50).map((p) => p.toJSON()),
    };
  }

  private matches(p: Payment, { cardBrand, status, ticketType, discountUsed, from, to }: ReportFilters) {
    if (cardBrand && p.cardBrand !== cardBrand) return false;
    if (status && p.status !== status) return false;
    if (ticketType && !p.lines.some((l) => l.ticketId === ticketType)) return false;
    if (discountUsed === "yes" && p.discountedQty === 0) return false;
    if (discountUsed === "no" && p.discountedQty > 0) return false;
    const day = toDay(new Date(p.createdAt));
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  }

  // Dropdown values come from all payments so options don't vanish when a filter is applied.
  private options(all: Payment[]) {
    return {
      cardBrands: [...new Set(all.map((p) => p.cardBrand))].sort(),
      statuses: ["Approved", "Declined"],
      ticketTypes: this.catalog.tickets.map((t) => ({ id: t.id, name: t.name })),
    };
  }

  private group<Row>(list: Payment[], keyOf: (p: Payment) => string, create: (key: string) => Row, accumulate: (row: Row, p: Payment) => void): Row[] {
    const rows = new Map<string, Row>();
    for (const p of list) {
      const key = keyOf(p);
      if (!rows.has(key)) rows.set(key, create(key));
      accumulate(rows.get(key)!, p);
    }
    return [...rows.values()];
  }

  private byTicketType(approved: Payment[]) {
    const rows = new Map(this.catalog.tickets.map((t) => [t.id, { id: t.id, name: t.name, tickets: 0, revenue: 0 }]));
    for (const p of approved) {
      for (const l of p.lines) {
        const row = rows.get(l.ticketId);
        if (!row) continue;
        row.tickets += l.quantity;
        row.revenue += l.net;
      }
    }
    return [...rows.values()];
  }

  private overTime(approved: Payment[]) {
    const byDay = this.group(
      approved,
      (p) => toDay(new Date(p.createdAt)),
      (date) => ({ date, revenue: 0, tickets: 0 }),
      (row, p) => {
        row.revenue += p.total;
        row.tickets += p.ticketCount;
      },
    );
    return byDay.sort((a, b) => a.date.localeCompare(b.date));
  }
}
