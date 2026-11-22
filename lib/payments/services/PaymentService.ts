import type { CheckoutRequest } from "../models/CheckoutRequest";
import { Payment, type PaymentStatus } from "../models/Payment";
import type { PaymentRepository } from "../repositories/PaymentRepository";
import { randomHex, SerialQueue, toDay } from "../utils";
import type { CardValidator } from "./CardValidator";
import type { PaymentProcessor } from "./PaymentProcessor";
import type { PricingService } from "./PricingService";

// Orchestrates one checkout: price -> (validate card + charge) -> record.
export class PaymentService {
  private readonly queue = new SerialQueue();

  constructor(
    private readonly pricing: PricingService,
    private readonly cardValidator: CardValidator,
    private readonly processor: PaymentProcessor,
    private readonly payments: PaymentRepository,
  ) {}

  // Runs one at a time so two simultaneous orders cannot both claim the last discounted tickets.
  checkout(request: CheckoutRequest, now: Date): Promise<Payment> {
    return this.queue.run(() => this.process(request, now));
  }

  private async process(request: CheckoutRequest, now: Date): Promise<Payment> {
    const order = await this.pricing.price(request, now);

    let card = { brand: "None", last4: null as string | null };
    let status: PaymentStatus = "Approved";
    let transactionId = "txn_free_" + randomHex(4);

    if (order.total > 0) {
      card = this.cardValidator.validate(request.card);
      const result = await this.processor.charge({ card: request.card!, amountCents: order.total });
      status = result.approved ? "Approved" : "Declined";
      transactionId = result.transactionId;
    }

    const created = new Date();
    const payment = new Payment({
      ...order,
      orderId: `MCC-${toDay(created).replaceAll("-", "")}-${randomHex(3).toUpperCase()}`,
      transactionId,
      createdAt: created.toISOString(),
      status,
      cardBrand: card.brand,
      cardLast4: card.last4,
    });
    await this.payments.save(payment);
    return payment;
  }
}
