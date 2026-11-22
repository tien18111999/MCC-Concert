import type { Catalog } from "../config/catalog";
import { ValidationError } from "../errors/AppError";
import type { PaymentLine } from "../models/Payment";
import type { CheckoutRequest } from "../models/CheckoutRequest";
import type { DiscountService } from "./DiscountService";
import type { SalePolicy } from "./SalePolicy";

export type PricedOrder = {
  lines: PaymentLine[];
  subtotal: number;
  discount: number;
  discountedQty: number;
  discountCode: string | null;
  donation: number;
  total: number;
  fee: number;
};

// Turns "quantities + code + donation" into priced order lines. Pure business rules, no I/O
// except asking DiscountService how many discounted tickets remain.
export class PricingService {
  constructor(
    private readonly catalog: Catalog,
    private readonly salePolicy: SalePolicy,
    private readonly discounts: DiscountService,
  ) {}

  async price(request: Pick<CheckoutRequest, "items" | "discountCode" | "donationCents">, now: Date): Promise<PricedOrder> {
    const { tickets, fee, maxDonationCents } = this.catalog;
    const { items, discountCode, donationCents } = request;

    for (const id of Object.keys(items)) {
      if (!tickets.some((t) => t.id === id)) throw new ValidationError(`Unknown ticket type: ${id}.`);
    }
    if (donationCents > maxDonationCents) {
      throw new ValidationError(`Donations are limited to $${maxDonationCents / 100}.`);
    }

    let rule = null;
    let remaining = 0;
    if (discountCode) {
      const check = await this.discounts.check(discountCode, now);
      if (!check.valid) throw new ValidationError(check.message);
      rule = this.discounts.getRule(discountCode);
      remaining = check.remaining;
    }

    const lines: PaymentLine[] = [];
    for (const t of tickets) {
      const quantity = items[t.id] ?? 0;
      if (quantity === 0) continue;
      if (quantity > t.max) throw new ValidationError(`You can buy up to ${t.max} ${t.name} tickets per order.`);
      if (!this.salePolicy.isOnSale(t, now)) throw new ValidationError(`${t.name} tickets are not on sale right now.`);

      const gross = t.price * quantity;
      const eligible = rule?.appliesTo.includes(t.id) ?? false;
      const discountedQty = eligible ? Math.min(quantity, remaining) : 0;
      remaining -= discountedQty;
      const discount = rule ? Math.round((t.price * discountedQty * rule.percent) / 100) : 0;
      lines.push({ ticketId: t.id, name: t.name, unitPrice: t.price, quantity, gross, discountedQty, discount, net: gross - discount });
    }
    if (lines.length === 0) throw new ValidationError("No tickets selected.");

    const sum = (pick: (l: PaymentLine) => number) => lines.reduce((s, l) => s + pick(l), 0);
    const subtotal = sum((l) => l.gross);
    const discount = sum((l) => l.discount);
    const total = subtotal - discount + donationCents;
    return {
      lines,
      subtotal,
      discount,
      discountedQty: sum((l) => l.discountedQty),
      discountCode: discountCode ?? null,
      donation: donationCents,
      total,
      fee: total > 0 ? Math.round((total * fee.percent) / 100) + fee.fixedCents : 0,
    };
  }
}
