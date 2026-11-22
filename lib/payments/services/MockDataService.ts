import { Payment, type PaymentData } from "../models/Payment";
import type { PaymentRepository } from "../repositories/PaymentRepository";

// Dev/testing helpers: fill the data store with fake payments, or wipe it.
export class MockDataService {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly loadMockPayments: () => Promise<PaymentData[]>,
  ) {}

  /** Adds the mock payments. Safe to call twice: orders already stored (same orderId) are skipped. */
  async loadMock() {
    const mock = (await this.loadMockPayments()).map(Payment.fromJSON);
    const existing = new Set((await this.payments.findAll()).map((p) => p.orderId));
    const fresh = mock.filter((p) => !existing.has(p.orderId));
    await this.payments.saveMany(fresh);
    return { loaded: fresh.length, skipped: mock.length - fresh.length, totalPayments: existing.size + fresh.length };
  }

  /** Deletes the data file and starts again from zero. */
  async reset() {
    await this.payments.reset();
  }
}
