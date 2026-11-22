import type { Payment } from "../models/Payment";
import { Stats, type StatsData } from "../models/Stats";
import type { PaymentRepository } from "./PaymentRepository";

// Lost on restart. Used by tests.
export class InMemoryPaymentRepository implements PaymentRepository {
  private payments: Payment[] = [];
  private stats: StatsData = Stats.empty();

  async findAll() {
    return [...this.payments];
  }

  async save(payment: Payment) {
    await this.saveMany([payment]);
  }

  async saveMany(payments: Payment[]) {
    for (const payment of payments) {
      this.payments.push(payment);
      Stats.record(this.stats, payment);
    }
  }

  async getStats() {
    return structuredClone(this.stats);
  }

  async reset() {
    this.payments = [];
    this.stats = Stats.empty();
  }
}
