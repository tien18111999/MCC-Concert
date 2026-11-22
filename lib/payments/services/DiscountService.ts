import type { Catalog, DiscountRule } from "../config/catalog";
import type { PaymentRepository } from "../repositories/PaymentRepository";
import type { SalePolicy } from "./SalePolicy";

export type DiscountCheck =
  | { valid: true; code: string; percent: number; appliesTo: string[]; remaining: number }
  | { valid: false; code: string; message: string };

const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric" });

// Knows the discount codes and how many discounted tickets are left.
// "Used" is read from the running totals stored with the payments (approved payments only),
// so it is shared by every buyer and survives restarts.
export class DiscountService {
  constructor(
    private readonly catalog: Catalog,
    private readonly salePolicy: SalePolicy,
    private readonly payments: PaymentRepository,
  ) {}

  getRule(code: string): DiscountRule | null {
    return Object.hasOwn(this.catalog.discountCodes, code) ? this.catalog.discountCodes[code] : null;
  }

  async used(code: string) {
    const stats = await this.payments.getStats();
    return stats.discountedTickets[code] ?? 0;
  }

  async remaining(code: string) {
    const rule = this.getRule(code);
    return rule ? Math.max(0, rule.limit - (await this.used(code))) : 0;
  }

  /** Can this code be applied right now? */
  async check(rawCode: string, now: Date): Promise<DiscountCheck> {
    const code = String(rawCode ?? "").trim().toUpperCase();
    const rule = this.getRule(code);
    if (!rule) return { valid: false, code, message: "That code is not valid." };

    const tickets = this.catalog.tickets.filter((t) => rule.appliesTo.includes(t.id));
    if (!tickets.some((t) => this.salePolicy.isOnSale(t, now))) {
      const first = tickets[0];
      const message =
        first && this.salePolicy.stateOf(first, now) === "upcoming"
          ? `${code} can be used once ${first.name} goes on sale (${shortDate(first.from)}).`
          : `${code} is no longer available.`;
      return { valid: false, code, message };
    }

    const remaining = await this.remaining(code);
    if (remaining === 0) {
      return { valid: false, code, message: `Sorry, all ${rule.limit} ${code} discounts have been used.` };
    }
    return { valid: true, code, percent: rule.percent, appliesTo: rule.appliesTo, remaining };
  }
}
