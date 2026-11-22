import { ValidationError } from "../errors/AppError";

export interface CardInput {
  name: string;
  number: string; // digits only
  expiry: string;
  cvc: string;
}

// Parses and validates the raw JSON body of POST /api/payments.
// Shape checks only; business rules (prices, sale windows, limits) live in the services.
export class CheckoutRequest {
  constructor(
    readonly items: Record<string, number>, // ticketId -> quantity
    readonly discountCode: string | null,
    readonly donationCents: number,
    readonly card: CardInput | null,
  ) {}

  static parse(body: unknown): CheckoutRequest {
    if (!body || typeof body !== "object") throw new ValidationError("Invalid request.");
    const raw = body as Record<string, unknown>;

    if (!raw.items || typeof raw.items !== "object" || Array.isArray(raw.items)) {
      throw new ValidationError("No tickets selected.");
    }
    const items: Record<string, number> = {};
    for (const [id, quantity] of Object.entries(raw.items as Record<string, unknown>)) {
      if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 0) {
        throw new ValidationError(`Invalid quantity for ${id}.`);
      }
      if (quantity > 0) items[id] = quantity;
    }

    const donation = raw.donation == null || raw.donation === "" ? 0 : Number(raw.donation);
    if (!Number.isFinite(donation) || donation < 0) throw new ValidationError("Invalid donation amount.");

    const code = typeof raw.discountCode === "string" ? raw.discountCode.trim().toUpperCase() : "";

    let card: CardInput | null = null;
    if (raw.card != null) {
      if (typeof raw.card !== "object") throw new ValidationError("Invalid card details.");
      const c = raw.card as Record<string, unknown>;
      card = {
        name: String(c.name ?? "").trim(),
        number: String(c.number ?? "").replace(/\D/g, ""),
        expiry: String(c.expiry ?? "").trim(),
        cvc: String(c.cvc ?? "").trim(),
      };
    }

    return new CheckoutRequest(items, code || null, Math.round(donation * 100), card);
  }
}
