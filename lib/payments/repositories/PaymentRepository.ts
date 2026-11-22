import type { Payment } from "../models/Payment";
import type { StatsData } from "../models/Stats";

// Storage contract. Services depend on this, never on a concrete store (Dependency Inversion),
// so swapping the JSON file for SQLite/Postgres means writing one new class.
export interface PaymentRepository {
  /** All payments, oldest first. */
  findAll(): Promise<Payment[]>;
  /** Stores one payment and updates the running totals. */
  save(payment: Payment): Promise<void>;
  /** Stores several payments at once. */
  saveMany(payments: Payment[]): Promise<void>;
  /** Running totals (see models/Stats.ts). */
  getStats(): Promise<StatsData>;
  /** Deletes everything and starts again from zero. */
  reset(): Promise<void>;
}
