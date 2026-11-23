import assert from "node:assert/strict";
import { test } from "node:test";
import type { AppConfig } from "../config";
import { buildContainer } from "../container";
import { InMemoryPaymentRepository } from "../repositories/InMemoryPaymentRepository";

const config: AppConfig = { dataFile: "unused", mockFile: "unused", allowSimulatedDate: true, enableDevEndpoints: true };

function makeApi() {
  const repo = new InMemoryPaymentRepository();
  const c = buildContainer({ config, paymentRepository: repo });
  const read = async (res: Response) => ({ status: res.status, body: (await res.json()) as any });
  return {
    repo,
    assumptions: async () => read(await c.forecastController.assumptions()),
    calculate: async (body: unknown) =>
      read(await c.forecastController.calculate(new Request("http://x/api/forecast", { method: "POST", body: JSON.stringify(body) }))),
    random: async () => read(await c.forecastController.random()),
  };
}

test("forecast assumptions come from the catalog config", async () => {
  const { body } = await makeApi().assumptions();
  assert.deepEqual(body.prices, { earlyBird: 800, general: 1500, discounted: 1050, atDoor: 1800 });
  assert.equal(body.vendorFee, 50000);
  assert.equal(body.capacity, 700);
  assert.deepEqual(body.discount, { code: "MCCVIBES", percent: 30, limit: 50 });
  assert.equal(body.limits.vendors, 30);
});

test("forecast math: online tickets, door, vendors and total", async () => {
  const { status, body } = await makeApi().calculate({ earlyBird: 100, general: 50, discounted: 10, atDoor: 20, vendors: 6 });
  assert.equal(status, 200);
  assert.equal(body.tickets.discounted.revenue, 10500); // 10 x $10.50 = $105
  assert.equal(body.totals.onlineTickets, 100 * 800 + 50 * 1500 + 10500); // $1,655
  assert.equal(body.totals.doorTickets, 20 * 1800);
  assert.equal(body.totals.vendors, 6 * 50000); // each vendor pays $500
  assert.equal(body.totals.grandTotal, 165500 + 36000 + 300000);
  assert.equal(body.totals.attendees, 180);
  assert.equal(body.totals.onlineTicketCount, 160);
  assert.equal(body.totals.overCapacity, false);
});

test("forecast: missing fields count as zero and an empty forecast is all zeros", async () => {
  const { body } = await makeApi().calculate({});
  assert.equal(body.totals.grandTotal, 0);
  assert.equal(body.totals.attendees, 0);
});

test("forecast flags over capacity but still calculates", async () => {
  const { body } = await makeApi().calculate({ earlyBird: 400, general: 400 });
  assert.equal(body.totals.overCapacity, true);
  assert.equal(body.totals.attendees, 800);
});

test("forecast validation returns 400", async () => {
  const api = makeApi();
  for (const bad of [{ discounted: 51 }, { vendors: 31 }, { earlyBird: 701 }, { general: -1 }, { atDoor: 1.5 }, { vendors: "3" }, null]) {
    assert.equal((await api.calculate(bad)).status, 400, JSON.stringify(bad));
  }
});

test("random forecast always has exactly 500 tickets, split at random, within the limits", async () => {
  const api = makeApi();
  for (let i = 0; i < 200; i++) {
    const { status, body } = await api.random();
    assert.equal(status, 200);
    const { earlyBird, general, discounted, atDoor, vendors } = body.input;
    assert.equal(earlyBird + general + discounted + atDoor, 500);
    assert.ok(discounted >= 10 && discounted <= 50);
    assert.ok(earlyBird > 0 && general > 0 && atDoor > 0);
    assert.ok(vendors >= 5 && vendors <= 12);
    assert.equal(body.totals.attendees, 500);
    assert.equal(body.totals.overCapacity, false);
  }
});

test("forecast never touches real payments or the discount counter", async () => {
  const api = makeApi();
  await api.calculate({ discounted: 50, earlyBird: 10 });
  await api.random();
  assert.equal((await api.repo.findAll()).length, 0);
  assert.deepEqual((await api.repo.getStats()).discountedTickets, {});
});
