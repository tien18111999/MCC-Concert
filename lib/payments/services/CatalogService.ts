import type { Catalog } from "../config/catalog";
import { toDay } from "../utils";

export type PublicCatalog = {
  doorPrice: number;
  tickets: { id: string; name: string; price: number; max: number; note: string; from: string; until: string }[];
};

// What the ticket page is allowed to know. Discount codes are deliberately NOT included:
// the page learns a code's terms only after the buyer enters it.
export class CatalogService {
  constructor(private readonly catalog: Catalog) {}

  publicView(): PublicCatalog {
    return {
      doorPrice: this.catalog.doorPrice,
      tickets: this.catalog.tickets.map((t) => ({
        id: t.id,
        name: t.name,
        price: t.price,
        max: t.max,
        note: t.note,
        from: toDay(t.from),
        until: toDay(t.until), // YYYY-MM-DD; the first day it is NOT on sale
      })),
    };
  }
}
