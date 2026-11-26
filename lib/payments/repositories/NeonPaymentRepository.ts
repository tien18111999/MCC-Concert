import { neon } from "@neondatabase/serverless";
import { Payment, type PaymentLine } from "../models/Payment";
import { Stats } from "../models/Stats";
import type { PaymentRepository } from "./PaymentRepository";

type Sql = ReturnType<typeof neon>;

function sql(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

function linesOf(value: unknown): PaymentLine[] {
  if (Array.isArray(value)) return value as PaymentLine[];
  if (typeof value === "string") return JSON.parse(value) as PaymentLine[];
  return [];
}

function textOrNull(value: unknown) {
  return value == null ? null : String(value);
}

export class NeonPaymentRepository implements PaymentRepository {
  private ready: Promise<void> | null = null;

  private prepare() {
    this.ready ??= sql()`
      create table if not exists payments (
        order_id text primary key,
        transaction_id text not null,
        created_at timestamptz not null,
        status text not null,
        card_brand text not null,
        card_last4 text,
        lines jsonb not null,
        subtotal integer not null,
        discount integer not null,
        discount_code text,
        discounted_qty integer not null default 0,
        donation integer not null default 0,
        total integer not null,
        fee integer not null default 0
      )
    `.then(() => undefined);
    return this.ready;
  }

  async findAll() {
    await this.prepare();
    const rows = (await sql()`
      select order_id, transaction_id, created_at, status, card_brand, card_last4,
             lines, subtotal, discount, discount_code, discounted_qty, donation, total, fee
      from payments
      order by created_at asc
    `) as Record<string, unknown>[];
    return rows.map((row) =>
      Payment.fromJSON({
        orderId: String(row.order_id),
        transactionId: String(row.transaction_id),
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
        status: row.status === "Declined" ? "Declined" : "Approved",
        cardBrand: String(row.card_brand),
        cardLast4: textOrNull(row.card_last4),
        lines: linesOf(row.lines),
        subtotal: Number(row.subtotal),
        discount: Number(row.discount),
        discountCode: textOrNull(row.discount_code),
        discountedQty: Number(row.discounted_qty),
        donation: Number(row.donation),
        total: Number(row.total),
        fee: Number(row.fee),
      }),
    );
  }

  async getStats() {
    return Stats.rebuild(await this.findAll());
  }

  save(payment: Payment) {
    return this.saveMany([payment]);
  }

  async saveMany(payments: Payment[]) {
    await this.prepare();
    for (const payment of payments) {
      const data = payment.toJSON();
      await sql()`
        insert into payments (
          order_id, transaction_id, created_at, status, card_brand, card_last4,
          lines, subtotal, discount, discount_code, discounted_qty, donation, total, fee
        ) values (
          ${data.orderId}, ${data.transactionId}, ${data.createdAt}, ${data.status}, ${data.cardBrand}, ${data.cardLast4},
          ${JSON.stringify(data.lines)}::jsonb, ${data.subtotal}, ${data.discount}, ${data.discountCode},
          ${data.discountedQty}, ${data.donation}, ${data.total}, ${data.fee}
        )
        on conflict (order_id) do nothing
      `;
    }
  }

  async reset() {
    await this.prepare();
    await sql()`delete from payments`;
  }
}
