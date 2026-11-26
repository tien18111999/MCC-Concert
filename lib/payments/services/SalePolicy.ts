import type { TicketConfig } from "../config/catalog";

export type SaleState = "upcoming" | "onsale" | "ended";

// Decides whether a ticket type is on sale at a given moment.
export class SalePolicy {
  stateOf(ticket: TicketConfig, now: Date): SaleState {
    if (now < ticket.from) return "upcoming";
    if (now >= ticket.until) return "ended";
    return "onsale";
  }

  isOnSale(ticket: TicketConfig, now: Date) {
    return this.stateOf(ticket, now) === "onsale";
  }
}
