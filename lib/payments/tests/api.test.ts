import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import type { AppConfig } from "../config";
import { buildContainer } from "../container";
import { InMemoryPaymentRepository } from "../repositories/InMemoryPaymentRepository";
import { JsonFilePaymentRepository } from "../repositories/JsonFilePaymentRepository";
import type { PaymentRepository } from "../repositories/PaymentRepository";

const GENERAL = "2027-05-30"; // General Admission phase
const EARLY = "2027-05-20"; // Early Bird phase
const VISA = { name: "Jane Doe", number: "4242 4242 4242 4242", expiry: "12/40", cvc: "123" };
const DECLINED = { ...VISA, number: "4000 0000 0000 0002" };
const MC = { ...VISA, number: "5555 5555 5555 4444" };

const baseConfig: AppConfig = {
  dataFile: "unused",
  mockFile: path.resolve("lib/payments/mock/mock-payments.json"),
  allowSimulatedDate: true,
  enableDevEndpoints: true,
};

// Calls the controllers exactly like the Next.js route files do, with Web-standard Request objects.
function makeApi(overrides: { config?: Partial<AppConfig>; paymentRepository?: PaymentRepository } = {}) {
  const repo = overrides.paymentRepository ?? new InMemoryPaymentRepository();
  const c = buildContainer({ config: { ...baseConfig, ...overrides.config }, paymentRepository: repo });
  const headers = (date?: string) => ({ "content-type": "application/json", ...(date ? { "x-simulated-date": date } : {}) });
  const read = async (res: Response) => ({ status: res.status, body: (await res.json()) as any });
  return {
    repo,
    handlers: { discount: c.discountController.check, pay: c.paymentController.create },
    pay: async (body: unknown, date?: string) =>
      read(await c.paymentController.create(new Request("http://x/api/payments", { method: "POST", headers: headers(date), body: JSON.stringify(body) }))),
    discount: async (code: string, date?: string) =>
      read(await c.discountController.check(new Request(`http://x/api/discounts/${code}`, { headers: headers(date) }), code)),
    report: async (query = "") => read(await c.reportController.get(new Request(`http://x/api/reports${query}`))),
    catalog: async () => read(await c.catalogController.get()),
    testCharge: async () => read(await c.devController.testCharge()),
    refresh: async () => read(await c.devController.refresh()),
  };
}

test("approved payment is priced by the server and stored without card number", async () => {
  const api = makeApi();
  const { status, body } = await api.pay({ items: { general: 2 }, card: VISA }, GENERAL);
  assert.equal(status, 201);
  assert.equal(body.status, "Approved");
  assert.equal(body.total, 3000);
  assert.equal(body.cardBrand, "Visa");
  assert.equal(body.cardLast4, "4242");
  const stored = JSON.stringify(await api.repo.findAll());
  assert.ok(!stored.includes("4242 4242") && !stored.includes("424242424242") && !stored.includes("Jane"));
});

test("client cannot set prices", async () => {
  const api = makeApi();
  const { body } = await api.pay({ items: { general: 1 }, price: 1, total: 1, card: VISA }, GENERAL);
  assert.equal(body.total, 1500);
});

test("declined card is recorded and does not use up the discount", async () => {
  const api = makeApi();
  const declined = await api.pay({ items: { general: 5 }, discountCode: "mccvibes", card: DECLINED }, GENERAL);
  assert.equal(declined.body.status, "Declined");
  assert.equal((await api.discount("MCCVIBES", GENERAL)).body.remaining, 50);
});

test("discount is capped at 50 tickets across orders", async () => {
  const api = makeApi();
  for (let i = 0; i < 4; i++) await api.pay({ items: { general: 10 }, discountCode: "MCCVIBES", card: VISA }, GENERAL);
  const fifth = await api.pay({ items: { general: 10 }, discountCode: "MCCVIBES", card: VISA }, GENERAL);
  assert.equal(fifth.body.discountedQty, 10);
  assert.equal(fifth.body.total, 10500);
  const next = await api.discount("MCCVIBES", GENERAL);
  assert.equal(next.body.valid, false);
  assert.match(next.body.message, /all 50/);
  assert.equal((await api.pay({ items: { general: 1 }, discountCode: "MCCVIBES", card: VISA }, GENERAL)).status, 400);
});

test("concurrent orders cannot both take the last discounted tickets", async () => {
  const api = makeApi();
  const results = await Promise.all(
    Array.from({ length: 8 }, () => api.pay({ items: { general: 10 }, discountCode: "MCCVIBES", card: VISA }, GENERAL)),
  );
  const discounted = results.filter((r) => r.body.status === "Approved").reduce((s, r) => s + r.body.discountedQty, 0);
  assert.equal(discounted, 50);
});

test("sale windows are enforced, with and without the simulated date", async () => {
  const api = makeApi();
  const early = await api.pay({ items: { general: 1 }, card: VISA }, EARLY);
  assert.equal(early.status, 400);
  assert.match(early.body.error, /not on sale/);
  assert.equal((await api.pay({ items: { early: 1 }, card: VISA })).status, 400); // real clock: before sales open
  assert.equal((await api.pay({ items: { early: 1 }, card: VISA }, EARLY)).status, 201);
});

test("?date= query parameter simulates the date, like the header", async () => {
  const api = makeApi();
  const get = async (url: string) => {
    const res = await api.handlers.discount(new Request(url), "MCCVIBES");
    return res.json() as Promise<any>;
  };
  assert.equal((await get("http://x/api/discounts/MCCVIBES?date=2027-05-30")).valid, true);
  assert.match((await get("http://x/api/discounts/MCCVIBES?date=2027-05-20")).message, /can be used once General Admission/);
  const pay = await api.handlers.pay(
    new Request("http://x/api/payments?date=2027-05-30", { method: "POST", body: JSON.stringify({ items: { general: 1 }, card: VISA }) }),
  );
  assert.equal(pay.status, 201);
});

test("simulated date is ignored when not allowed (production)", async () => {
  const api = makeApi({ config: { allowSimulatedDate: false } });
  assert.equal((await api.pay({ items: { early: 1 }, card: VISA }, EARLY)).status, 400);
  const res = await api.handlers.discount(new Request("http://x/api/discounts/MCCVIBES?date=2027-05-30"), "MCCVIBES");
  assert.equal(((await res.json()) as any).valid, false); // query parameter ignored too
});

test("validation errors return 400", async () => {
  const api = makeApi();
  for (const body of [
    { items: {}, card: VISA },
    { items: { general: 11 }, card: VISA },
    { items: { nope: 1 }, card: VISA },
    { items: { general: -1 }, card: VISA },
    { items: { general: 1 } },
    { items: { general: 1 }, card: { ...VISA, number: "4242 4242 4242 4243" } },
    { items: { general: 1 }, card: { ...VISA, expiry: "01/20" } },
    { items: { general: 1 }, card: { ...VISA, cvc: "12" } },
    { items: { general: 1 }, donation: 5000, card: VISA },
  ]) {
    assert.equal((await api.pay(body, GENERAL)).status, 400, JSON.stringify(body));
  }
});

test("free orders need no card and are recorded as None", async () => {
  const api = makeApi();
  const { body } = await api.pay({ items: { senior: 2 } }, GENERAL);
  assert.equal(body.total, 0);
  assert.equal(body.status, "Approved");
  assert.equal(body.cardBrand, "None");
});

test("report filters by card brand and status", async () => {
  const api = makeApi();
  await api.pay({ items: { general: 2 }, card: VISA }, GENERAL);
  await api.pay({ items: { general: 1 }, card: MC }, GENERAL);
  await api.pay({ items: { general: 1 }, card: DECLINED }, GENERAL);

  const all = (await api.report()).body;
  assert.equal(all.summary.orders, 3);
  assert.equal(all.summary.ticketsSold, 3);
  assert.equal(all.summary.revenue, 4500);
  assert.deepEqual(all.options.cardBrands, ["Mastercard", "Visa"]);

  const visa = (await api.report("?cardBrand=Visa")).body;
  assert.equal(visa.summary.revenue, 3000);
  assert.equal(visa.byCardBrand.length, 1);

  const declined = (await api.report("?status=Declined")).body;
  assert.equal(declined.summary.declinedOrders, 1);
  assert.equal(declined.summary.revenue, 0);

  assert.equal((await api.report("?from=bad")).status, 400);
});

test("report shows and filters discount usage", async () => {
  const api = makeApi();
  await api.pay({ items: { general: 3 }, discountCode: "MCCVIBES", card: VISA }, GENERAL); // 3 discounted
  await api.pay({ items: { general: 2 }, card: MC }, GENERAL); // no code
  await api.pay({ items: { general: 4 }, discountCode: "MCCVIBES", card: DECLINED }, GENERAL); // declined: not counted

  const all = (await api.report()).body;
  assert.equal(all.summary.discountedOrders, 1);
  assert.equal(all.summary.discountedTickets, 3);
  assert.equal(all.summary.discounts, 1350);
  assert.deepEqual(all.byDiscountCode, [{ code: "MCCVIBES", orders: 1, discountedTickets: 3, discountAmount: 1350 }]);
  assert.deepEqual(all.byDiscount.map((r: any) => [r.label, r.orders]), [["With discount", 1], ["No discount", 1]]);

  const yes = (await api.report("?discountUsed=yes&status=Approved")).body;
  assert.equal(yes.summary.orders, 1);
  assert.equal(yes.recent[0].discountCode, "MCCVIBES");
  const no = (await api.report("?discountUsed=no")).body;
  assert.equal(no.summary.orders, 1);
  assert.equal(no.summary.revenue, 3000);
  assert.equal((await api.report("?discountUsed=maybe")).status, 400);
});

test("JSON file is created by the first payment and stores payments plus running stats", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mcc-"));
  const file = path.join(dir, "sub", "payments.json"); // neither the folder nor the file exist yet
  const a = makeApi({ paymentRepository: new JsonFilePaymentRepository(file) });
  await assert.rejects(fs.access(file));
  await Promise.all([1, 2, 3].map(() => a.pay({ items: { general: 2 }, discountCode: "MCCVIBES", card: VISA }, GENERAL)));
  await a.pay({ items: { general: 1 }, discountCode: "MCCVIBES", card: DECLINED }, GENERAL);

  const saved = JSON.parse(await fs.readFile(file, "utf8"));
  assert.equal(saved.payments.length, 4);
  assert.equal(saved.stats.orders, 4);
  assert.equal(saved.stats.approvedOrders, 3);
  assert.equal(saved.stats.declinedOrders, 1);
  assert.equal(saved.stats.ticketsSold, 6);
  assert.equal(saved.stats.discountedTickets.MCCVIBES, 6); // declined order not counted
  assert.equal(saved.stats.revenue, 3 * 2 * 1050);

  const b = makeApi({ paymentRepository: new JsonFilePaymentRepository(file) }); // "restart"
  assert.equal((await b.report()).body.summary.orders, 4);
  assert.equal((await b.discount("MCCVIBES", GENERAL)).body.remaining, 44);
  await fs.rm(dir, { recursive: true });
});

test("/api/test-charge loads mock payments (once) and /api/refresh wipes the file", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mcc-"));
  const file = path.join(dir, "payments.json");
  const mockCount = JSON.parse(await fs.readFile(baseConfig.mockFile, "utf8")).length;
  const api = makeApi({ paymentRepository: new JsonFilePaymentRepository(file) });

  assert.equal((await api.testCharge()).body.loaded, mockCount);
  const second = (await api.testCharge()).body;
  assert.equal(second.loaded, 0);
  assert.equal(second.skipped, mockCount);
  assert.equal((await api.report()).body.summary.orders, mockCount);
  assert.equal((await api.discount("MCCVIBES", GENERAL)).body.remaining, 13);

  assert.equal((await api.refresh()).body.totalPayments, 0);
  const saved = JSON.parse(await fs.readFile(file, "utf8"));
  assert.deepEqual(saved.payments, []);
  assert.equal(saved.stats.orders, 0);
  assert.equal((await api.report()).body.summary.orders, 0);
  assert.equal((await api.pay({ items: { general: 1 }, card: VISA }, GENERAL)).status, 201); // ready for new payments
  await fs.rm(dir, { recursive: true });
});

test("dev endpoints are off when disabled (production)", async () => {
  const api = makeApi({ config: { enableDevEndpoints: false } });
  assert.equal((await api.refresh()).status, 404);
  assert.equal((await api.testCharge()).status, 404);
});

test("catalog exposes limits and windows but not discount codes", async () => {
  const { body } = await makeApi().catalog();
  assert.equal(body.tickets.find((t: any) => t.id === "general").max, 10);
  assert.equal(body.tickets.find((t: any) => t.id === "early").until, "2027-05-29");
  assert.equal(body.doorPrice, 1800);
  assert.ok(!JSON.stringify(body).includes("MCCVIBES"));
});
