# MCC Turn It Up backend

The payments and reporting backend, built into the Next.js app as API routes (`app/api/*`). It prices and records ticket payments, stores them in a JSON file, and feeds the sales report page at `/reports`.

```bash
npm install     # from the project root
npm run dev     # http://localhost:3000 (Next picks 3001 if 3000 is busy)
npm test        # 14 API tests
npm run mock:generate   # rebuild lib/payments/mock/mock-payments.json
```

Set `DATA_FILE` to change where payments are stored. The existing waitlist and volunteer features still use Neon Postgres (`DATABASE_URL`); payments do not.

## Structure

Everything for payments lives in `lib/payments/`, next to the project's existing `lib/` files. Only the route files, the page and the UI components sit elsewhere, where Next.js needs them.

```
lib/payments/
  config/         catalog.ts: ticket prices, per-order limits, sale windows, discount codes, fees.
                  The one place to edit them. index.ts: file paths and dev switches
  models/         Payment, CheckoutRequest, Stats
  repositories/   PaymentRepository (interface), JsonFilePaymentRepository, InMemoryPaymentRepository
  services/       PricingService, DiscountService, SalePolicy, CatalogService, CardValidator,
                  PaymentProcessor (interface) + MockCardProcessor, PaymentService, ReportService, MockDataService
  controllers/    HTTP only: parse the request, call a service, build the Response
  errors/         AppError, ValidationError, NotFoundError
  container.ts    composition root: the only place that picks concrete classes
  http.ts, utils.ts   response helpers, simulated-date clock, small utilities
  mock/           mock-payments.json (160 fake payments for /api/test-charge) + generate-mock-payments.ts
  tests/          API tests
  docs/           this README and the Postman collection

app/api/          thin route files: catalog, discounts/[code], payments, reports, test-charge, refresh
app/reports/      sales report page
components/       TicketDesk.tsx (ticket page), ReportsDashboard.tsx (charts + table)
lib/tickets.ts    client-side helpers for the ticket page (price preview, card form checks)
data/payments.json   the payments "database" (git-ignored, created on first payment)
```

Route files only call a controller, controllers only handle HTTP, services hold the business rules, and services depend on interfaces (`PaymentRepository`, `PaymentProcessor`). Changing the database or the payment provider means writing one class and swapping it in `lib/payments/container.ts`.

## Storage

Payments live in `data/payments.json` (git-ignored, outside `public/`, so it can't be downloaded). The file is created by the first payment, or by `/api/refresh`:

```json
{ "payments": [ ... ], "stats": { "orders": 3, "ticketsSold": 6, "discountedTickets": { "MCCVIBES": 2 }, "revenue": 8200, ... } }
```

`stats` keeps running totals (orders, tickets per type, **discounted tickets per code**, revenue per card brand, donations, fees). The discount limit is checked against it. Only the card brand and last 4 digits are stored, never the number, CVC or name. Money is always in **cents**.

A JSON file needs a writable disk. It works locally and on a normal server, but **not on Vercel** (read-only, and each request may run on a different instance). To deploy there, write a `PaymentRepository` that uses Neon Postgres and swap it in `lib/payments/container.ts`.

## Dev vs. production

Every endpoint works the same in development (`npm run dev`) and production (`npm run build` + `npm start`), including `/api/test-charge`, `/api/refresh` and the `?date=` / `X-Simulated-Date` simulated date.

**Warning:** these have no login. Anyone who knows the URL can delete all payments (`/api/refresh`), load fake ones (`/api/test-charge`), or buy tickets before sales open by adding `?date=`. To switch them off on a live site, set `ENABLE_DEV_ENDPOINTS=false` and/or `ALLOW_SIMULATED_DATE=false`.

## Using the API in Postman

1. Run `npm run dev`.
2. In Postman: **Import** → pick `lib/payments/docs/MCC-Concert.postman_collection.json`. It has one request per example below and two variables: `baseUrl` (`http://localhost:3000`) and `simDate` (`2027-05-30`).
3. Or create the requests by hand using the method, URL, headers and body shown for each endpoint.

### Testing a date: `?date=` or `X-Simulated-Date`

Online sales open **2027-05-12**, so today's real date is before any sale. To test a sale phase, add `?date=YYYY-MM-DD` to the URL of `/api/discounts/:code` or `/api/payments` (or send the header `X-Simulated-Date: YYYY-MM-DD`; the query parameter wins if both are sent). It works in production too; set `ALLOW_SIMULATED_DATE=false` to ignore it.

Example: http://localhost:3000/api/discounts/MCCVIBES?date=2027-05-30

| Date | Phase |
|---|---|
| `2027-05-01` | Sales not open yet |
| `2027-05-20` | Early Bird + Senior on sale |
| `2027-05-30` | General Admission + Senior on sale (use this to test `MCCVIBES`) |
| `2027-06-12` | Online sales closed |

### Test cards

| Number | Result |
|---|---|
| `4242 4242 4242 4242` | Approved (Visa) |
| `5555 5555 5555 4444` | Approved (Mastercard) |
| `4000 0000 0000 0002` | Always declined |

Any future expiry (`MM/YY`) and a 3-digit CVC (4 for Amex).

---

## Endpoints

### `GET /api/catalog`: list tickets

The ticket page uses this to draw itself. No headers or body. Discount codes are not included.

**Postman:** GET `{{baseUrl}}/api/catalog` → Send

**Response `200`**
```json
{
  "doorPrice": 1800,
  "tickets": [
    { "id": "early", "name": "Early Bird", "price": 800, "max": 10, "note": "Limited-time online price", "from": "2027-05-12", "until": "2027-05-29" },
    { "id": "general", "name": "General Admission", "price": 1500, "max": 10, "note": "Standard festival entry", "from": "2027-05-29", "until": "2027-06-12" },
    { "id": "senior", "name": "Senior", "price": 0, "max": 10, "note": "Free for senior guests", "from": "2027-05-12", "until": "2027-06-12" }
  ]
}
```
`until` is the first day the ticket is **not** on sale.

---

### `GET /api/discounts/:code`: check a discount code

Is the code valid right now, and how many discounted tickets are left? Case-insensitive.

**Postman:** GET `{{baseUrl}}/api/discounts/MCCVIBES` · Query `?date=2027-05-30` (or header `X-Simulated-Date`)

**Response `200`, valid**
```json
{ "valid": true, "code": "MCCVIBES", "percent": 30, "appliesTo": ["general"], "remaining": 50 }
```

**Response `200`, not valid** (`valid` is `false` and `message` says why)

| Case | `message` |
|---|---|
| `/api/discounts/NOPE` | `That code is not valid.` |
| `MCCVIBES` with `X-Simulated-Date: 2027-05-20` | `MCCVIBES can be used once General Admission goes on sale (May 29).` |
| All 50 used | `Sorry, all 50 MCCVIBES discounts have been used.` |

---

### `POST /api/payments`: checkout

Prices the order on the server (the client can't set prices), charges the card and records the result.

**Postman:** POST `{{baseUrl}}/api/payments`
- **Headers:** `Content-Type: application/json`, `X-Simulated-Date: 2027-05-30`
- **Body → raw → JSON:**

```json
{
  "items": { "general": 2, "senior": 1 },
  "discountCode": "MCCVIBES",
  "donation": 5,
  "card": { "name": "Jane Doe", "number": "4242 4242 4242 4242", "expiry": "12/30", "cvc": "123" }
}
```

| Field | Notes |
|---|---|
| `items` | Ticket id → quantity. Ids: `early`, `general`, `senior`. Max per order is set in `lib/payments/config/catalog.ts` (10) |
| `discountCode` | Optional |
| `donation` | Optional, in dollars (max $1000) |
| `card` | Required unless the order is free ($0) |

**Response `201`, approved**
```json
{
  "orderId": "MCC-20261122-77EF6F",
  "transactionId": "txn_d60928c41b280218",
  "createdAt": "2026-11-22T18:41:32.515Z",
  "status": "Approved",
  "cardBrand": "Visa",
  "cardLast4": "4242",
  "lines": [
    { "ticketId": "general", "name": "General Admission", "unitPrice": 1500, "quantity": 2, "gross": 3000, "discountedQty": 2, "discount": 900, "net": 2100 },
    { "ticketId": "senior", "name": "Senior", "unitPrice": 0, "quantity": 1, "gross": 0, "discountedQty": 0, "discount": 0, "net": 0 }
  ],
  "subtotal": 3000,
  "discount": 900,
  "discountCode": "MCCVIBES",
  "discountedQty": 2,
  "donation": 500,
  "total": 2600,
  "fee": 105
}
```
`total` is $26.00 (30% off two $15 tickets, plus a $5 donation). `fee` is the processor cost to the organizer and is not added to the customer's total.

**Declined card.** Use card `4000 0000 0000 0002`. The response is also `201`, because a decline is a normal outcome. It is stored too, but it does **not** use up any discount.
```json
{ "orderId": "MCC-20261122-83FBBB", "status": "Declined", "cardBrand": "Visa", "cardLast4": "0002", "subtotal": 1500, "total": 1500, "...": "..." }
```

**Free order.** Send only free tickets and no `card`. It is approved with `cardBrand: "None"`.
```json
{ "items": { "senior": 2 } }
```

**Errors `400`**, body `{ "error": "..." }`

| Request | `error` |
|---|---|
| 11 General tickets | `You can buy up to 10 General Admission tickets per order.` |
| General tickets without `X-Simulated-Date` (before sales open) | `General Admission tickets are not on sale right now.` |
| No tickets / unknown ticket id | `No tickets selected.` / `Unknown ticket type: x.` |
| Bad card number, expiry or CVC | `Please enter a valid card number.`, `This card has expired.`, `Please enter the 3-digit CVC.` |
| Paid order with no `card` | `Card details are required.` |
| Used-up or not-yet-valid code | the same message as the discount endpoint |

---

### `GET /api/reports`: sales report

Aggregated sales, used by the `/reports` page. Revenue and ticket counts include **approved** payments only.

**Postman:** GET `{{baseUrl}}/api/reports` → add filters in the **Params** tab

| Query param | Example | Meaning |
|---|---|---|
| `cardBrand` | `Visa` | `Visa`, `Mastercard`, `Amex`, `Discover`, `None` |
| `status` | `Approved` | `Approved` or `Declined` |
| `ticketType` | `general` | Orders containing that ticket |
| `discountUsed` | `yes` | `yes` = only orders that used a discount code, `no` = only orders that did not |
| `from`, `to` | `2027-05-20` | Dates, `YYYY-MM-DD` |

Example: `GET {{baseUrl}}/api/reports?cardBrand=Visa&status=Approved`

**Response `200`** (shortened)
```json
{
  "filters": { "cardBrand": "Visa", "status": "Approved" },
  "options": { "cardBrands": ["None", "Visa"], "statuses": ["Approved", "Declined"], "ticketTypes": [{ "id": "general", "name": "General Admission" }] },
  "summary": { "orders": 1, "approvedOrders": 1, "declinedOrders": 0, "ticketsSold": 3, "discountedOrders": 1, "discountedTickets": 2, "revenue": 2600, "discounts": 900, "donations": 500, "processorFees": 105, "netRevenue": 2495 },
  "byCardBrand": [{ "brand": "Visa", "orders": 1, "tickets": 3, "revenue": 2600 }],
  "byTicketType": [{ "id": "general", "name": "General Admission", "tickets": 2, "revenue": 2100 }],
  "byDiscount": [{ "label": "With discount", "orders": 1, "tickets": 3, "revenue": 2600 }],
  "byDiscountCode": [{ "code": "MCCVIBES", "orders": 1, "discountedTickets": 2, "discountAmount": 900 }],
  "byStatus": [{ "status": "Approved", "count": 1 }],
  "overTime": [{ "date": "2026-11-22", "revenue": 2600, "tickets": 3 }],
  "recent": [ { "orderId": "MCC-20261122-77EF6F", "status": "Approved", "total": 2600, "...": "..." } ]
}
```
`recent` has up to 50 payments, newest first. A bad date returns `400` with `"from" must be YYYY-MM-DD.`

---

## Testing tools

These two are for testing. They overwrite or delete data and have no login (see the warning under *Dev vs. production*); set `ENABLE_DEV_ENDPOINTS=false` to turn them off. GET and POST both work, so you can also open them in a browser.

### `POST /api/test-charge`: load fake data

Adds the 160 fake payments from `lib/payments/mock/mock-payments.json` (mixed card brands, some declined, some free, spread over the sale period, 37 `MCCVIBES` tickets used). Run it, then open http://localhost:3000/reports. Running it twice adds nothing, because orders already stored are skipped.

**Postman:** POST `{{baseUrl}}/api/test-charge`

**Response `200`**
```json
{ "message": "Mock payments loaded.", "loaded": 160, "skipped": 0, "totalPayments": 160 }
```

### `POST /api/refresh`: start from zero

Deletes `data/payments.json` and creates a new empty one, ready for new payments.

**Postman:** POST `{{baseUrl}}/api/refresh`

**Response `200`**
```json
{ "message": "Data file deleted and recreated empty.", "totalPayments": 0 }
```

---

## Suggested walkthrough

1. `POST /api/refresh`: start clean.
2. `GET /api/discounts/MCCVIBES` with `X-Simulated-Date: 2027-05-30`: `remaining: 50`.
3. `POST /api/payments` approved example: note the `orderId`.
4. `GET /api/discounts/MCCVIBES` again: `remaining: 48`.
5. `POST /api/payments` with the declined card: `remaining` stays 48.
6. `POST /api/test-charge`, then `GET /api/reports?cardBrand=Visa` or open `/reports`.
