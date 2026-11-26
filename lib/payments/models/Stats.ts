import type { Payment } from "./Payment";

// Running totals kept next to the payments in the data file.
// Only Approved payments count toward tickets, revenue and discount usage.
export interface StatsData {
  orders: number;
  approvedOrders: number;
  declinedOrders: number;
  ticketsSold: number;
  ticketsByType: Record<string, number>; // { general: 12, ... }
  discountedTickets: Record<string, number>; // { MCCVIBES: 37 }: discounted tickets bought per code
  discountTotal: number; // cents given away in discounts
  revenue: number; // cents
  revenueByCardBrand: Record<string, number>; // cents
  donations: number; // cents
  processorFees: number; // cents
  updatedAt: string | null;
}

const add = (obj: Record<string, number>, key: string, n: number) => {
  obj[key] = (obj[key] ?? 0) + n;
};

export class Stats {
  static empty(): StatsData {
    return {
      orders: 0,
      approvedOrders: 0,
      declinedOrders: 0,
      ticketsSold: 0,
      ticketsByType: {},
      discountedTickets: {},
      discountTotal: 0,
      revenue: 0,
      revenueByCardBrand: {},
      donations: 0,
      processorFees: 0,
      updatedAt: null,
    };
  }

  /** Adds one payment to the totals (mutates and returns `stats`). */
  static record(stats: StatsData, payment: Payment): StatsData {
    stats.orders += 1;
    if (payment.status === "Approved") {
      stats.approvedOrders += 1;
      stats.revenue += payment.total;
      stats.donations += payment.donation;
      stats.processorFees += payment.fee;
      stats.discountTotal += payment.discount;
      add(stats.revenueByCardBrand, payment.cardBrand, payment.total);
      for (const line of payment.lines) {
        stats.ticketsSold += line.quantity;
        add(stats.ticketsByType, line.ticketId, line.quantity);
      }
      if (payment.discountCode && payment.discountedQty > 0) {
        add(stats.discountedTickets, payment.discountCode, payment.discountedQty);
      }
    } else {
      stats.declinedOrders += 1;
    }
    stats.updatedAt = new Date().toISOString();
    return stats;
  }

  static rebuild(payments: Payment[]): StatsData {
    const stats = Stats.empty();
    for (const payment of payments) Stats.record(stats, payment);
    return stats;
  }
}
