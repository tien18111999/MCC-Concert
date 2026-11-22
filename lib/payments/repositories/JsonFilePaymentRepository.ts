import fs from "node:fs/promises";
import path from "node:path";
import { Payment, type PaymentData } from "../models/Payment";
import { Stats, type StatsData } from "../models/Stats";
import { SerialQueue } from "../utils";
import type { PaymentRepository } from "./PaymentRepository";

type State = { payments: Payment[]; stats: StatsData };

// Our "database": one JSON file shaped { payments: [...], stats: {...} }.
//  - If the file does not exist, it is created by the first save (or by reset()).
//  - `stats` holds running totals, e.g. how many discounted tickets were bought per code.
//    It is rebuilt from `payments` whenever the file is loaded, so the two can't drift apart.
//  - Every change goes through one queue and is written atomically (temp file + rename).
export class JsonFilePaymentRepository implements PaymentRepository {
  private state: State | null = null;
  private loading: Promise<State> | null = null;
  private readonly queue = new SerialQueue();

  constructor(private readonly file: string) {}

  private load(): Promise<State> {
    this.loading ??= (async () => {
      try {
        const data = JSON.parse(await fs.readFile(this.file, "utf8")) as PaymentData[] | { payments?: PaymentData[] };
        const list = Array.isArray(data) ? data : (data.payments ?? []); // also accepts a plain array
        const payments = list.map(Payment.fromJSON);
        this.state = { payments, stats: Stats.rebuild(payments) };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        this.state = { payments: [], stats: Stats.empty() };
      }
      return this.state;
    })();
    return this.loading;
  }

  private async write(state: State) {
    const json = JSON.stringify({ payments: state.payments, stats: state.stats }, null, 2);
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    await fs.writeFile(tmp, json);
    await fs.rename(tmp, this.file);
  }

  async findAll() {
    const { payments } = await this.load();
    return [...payments];
  }

  async getStats() {
    const { stats } = await this.load();
    return structuredClone(stats);
  }

  save(payment: Payment) {
    return this.saveMany([payment]);
  }

  saveMany(payments: Payment[]) {
    return this.queue.run(async () => {
      const state = await this.load();
      for (const payment of payments) {
        state.payments.push(payment);
        Stats.record(state.stats, payment);
      }
      await this.write(state);
    });
  }

  reset() {
    return this.queue.run(async () => {
      await fs.rm(this.file, { force: true });
      const state: State = { payments: [], stats: Stats.empty() };
      this.state = state;
      this.loading = Promise.resolve(state);
      await this.write(state);
    });
  }
}
