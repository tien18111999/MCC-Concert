import type { CardInput } from "../models/CheckoutRequest";

// Contract for whatever actually moves the money (Stripe, Square, ...).
export interface PaymentProcessor {
  charge(request: { card: CardInput; amountCents: number }): Promise<{ approved: boolean; transactionId: string }>;
}
