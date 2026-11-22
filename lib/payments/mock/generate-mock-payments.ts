// Regenerates lib/payments/mock/mock-payments.json (fake payments for live testing).
// Run: npm run mock:generate
// Deterministic (seeded), so the output only changes when this file or the catalog changes.
import fs from "node:fs";
import path from "node:path";
import { buildCatalog } from "../config/catalog";
import type { PaymentData, PaymentLine } from "../models/Payment";

const ORDERS = 160;
const DISCOUNT_TICKETS_TO_USE = 37; // leaves some of the 50 MCCVIBES discounts free for manual testing
const CODE = "MCCVIBES";

const catalog = buildCatalog();
const rule = catalog.discountCodes[CODE];
const byId = Object.fromEntries(catalog.tickets.map((t) => [t.id, t]));

// Small seeded random number generator (mulberry32)
let seed = 20270612;
const rand = (): number => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(list: T[]): T => list[Math.floor(rand() * list.length)];
const weighted = <T>(entries: [T, number][]): T => {
  let r = rand() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [value, weight] of entries) if ((r -= weight) < 0) return value;
  return entries[0][0];
};
const hex = (n: number) => Array.from({ length: n }, () => int(0, 15).toString(16)).join("");
const pad = (n: number) => String(n).padStart(2, "0");

const dayMs = 86400000;
const openDay = catalog.tickets[0].from;
const lastDay = new Date(catalog.eventDate.getTime() - dayMs);
const days = Math.round((lastDay.getTime() - openDay.getTime()) / dayMs);

const timestamps = Array.from(
  { length: ORDERS },
  () => new Date(openDay.getFullYear(), openDay.getMonth(), openDay.getDate() + int(0, days), int(9, 22), int(0, 59), int(0, 59)),
).sort((a, b) => a.getTime() - b.getTime());

let discountLeft = DISCOUNT_TICKETS_TO_USE;
const usedIds = new Set<string>();

const payments: PaymentData[] = timestamps.map((created) => {
  const onSale = catalog.tickets.filter((t) => created >= t.from && created < t.until);
  const main = onSale.find((t) => t.price > 0)!;
  const senior = onSale.find((t) => t.price === 0)!;

  const freeOnly = rand() < 0.12;
  const quantities: Record<string, number> = {};
  if (!freeOnly) quantities[main.id] = weighted([[1, 25], [2, 35], [3, 15], [4, 15], [5, 5], [6, 5]]);
  if (freeOnly || rand() < 0.25) quantities[senior.id] = freeOnly ? int(1, 3) : int(1, 2);

  const donation = freeOnly ? 0 : rand() < 0.2 ? pick([500, 1000, 2000, 2500]) : 0;
  const declined = !freeOnly && rand() < 0.08;

  // MCCVIBES only counts when the payment is approved (like the real server).
  const wantsCode = Boolean(quantities.general) && rand() < 0.55 && discountLeft > 0;
  const lines: PaymentLine[] = Object.entries(quantities).map(([id, quantity]) => {
    const t = byId[id];
    const eligible = wantsCode && rule.appliesTo.includes(id);
    const discountedQty = eligible ? Math.min(quantity, discountLeft) : 0;
    const gross = t.price * quantity;
    const discount = Math.round((t.price * discountedQty * rule.percent) / 100);
    return { ticketId: id, name: t.name, unitPrice: t.price, quantity, gross, discountedQty, discount, net: gross - discount };
  });
  const discountedQty = lines.reduce((s, l) => s + l.discountedQty, 0);
  if (!declined) discountLeft -= discountedQty;

  const subtotal = lines.reduce((s, l) => s + l.gross, 0);
  const discount = lines.reduce((s, l) => s + l.discount, 0);
  const total = subtotal - discount + donation;
  const free = total === 0;

  let orderId: string;
  do {
    orderId = `MCC-${created.getFullYear()}${pad(created.getMonth() + 1)}${pad(created.getDate())}-${hex(6).toUpperCase()}`;
  } while (usedIds.has(orderId));
  usedIds.add(orderId);

  return {
    orderId,
    transactionId: free ? "txn_free_" + hex(8) : "txn_" + hex(16),
    createdAt: created.toISOString(),
    status: declined ? "Declined" : "Approved",
    cardBrand: free ? "None" : weighted([["Visa", 45], ["Mastercard", 30], ["Amex", 15], ["Discover", 10]]),
    cardLast4: free ? null : String(int(0, 9999)).padStart(4, "0"),
    lines,
    subtotal,
    discount,
    discountCode: discountedQty > 0 ? CODE : null,
    discountedQty,
    donation,
    total,
    fee: free ? 0 : Math.round((total * catalog.fee.percent) / 100) + catalog.fee.fixedCents,
  };
});

const out = path.join(process.cwd(), "lib", "payments", "mock", "mock-payments.json");
fs.writeFileSync(out, JSON.stringify(payments, null, 2));
console.log(`Wrote ${payments.length} payments to ${out}; ${DISCOUNT_TICKETS_TO_USE - discountLeft} discounted tickets used.`);
