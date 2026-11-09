# MCC Community Music Festival – Website

Website for the Midwestern Career College (MCC) Community Music Festival.

- **Date:** Saturday, June 12, 2027 · 12:00 PM – 8:00 PM
- **Location:** Columbus Park, 500 S Central Ave, Chicago

## Pages

| File | Description |
|---|---|
| `index.html` | Festival home page: about, vendors, schedules, map, volunteer sign-up |
| `tickets.html` | Ticket sales: ticket selection, discount codes, donation and demo card checkout |

Both pages are static HTML using Tailwind CSS and Font Awesome from a CDN. No build step is needed; open the files in a browser.

## Running locally

From the project folder, start a local web server (requires Python):

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Then open:

| Page | URL |
|---|---|
| Home | http://127.0.0.1:8000/index.html |
| Tickets (today's date) | http://127.0.0.1:8000/tickets.html |

Press `Ctrl+C` in the terminal to stop the server. An internet connection is needed because Tailwind CSS and Font Awesome load from a CDN.

## Testing the tickets page

### Test URLs for each sale phase

| Phase | URL | What you should see |
|---|---|---|
| Sales not open yet | http://127.0.0.1:8000/tickets.html?date=2027-05-01 | All tickets blocked, banner says when sales open |
| Early Bird | http://127.0.0.1:8000/tickets.html?date=2027-05-20 | Early Bird + Senior on sale; `MCCVIBES` is rejected ("can be used once General Admission goes on sale (May 29)") |
| General Admission | http://127.0.0.1:8000/tickets.html?date=2027-05-30 | General + Senior on sale; use this one to test the discount |
| Sales closed | http://127.0.0.1:8000/tickets.html?date=2027-06-12 | Online sales closed, tickets $18 at the gate |

### Test checklist (General Admission phase)

1. **Order limit:** add General tickets. The + button should stop at 10, and typing 25 should change back to 10.
2. **Discount:** apply `mccvibes` (lowercase works too). 10 General tickets should total **$105.00**.
3. **Senior tickets:** add some. They are free and not affected by the code.
4. **Successful payment:** pay with test card `4242 4242 4242 4242`, any future expiry (e.g. `12/30`) and CVC `123`. To check the count, press `F12`, open the **Console** tab and run `localStorage.getItem('mcc-discount-used-MCCVIBES')`. It should return **"10"**. (The page does not show buyers how many discounts are left.)
5. **Declined payment:** pay with `4000 0000 0000 0002`. It is always declined, and the discount count should **not** change.
6. **Discount used up:** keep buying with the code until 50 are used. The code should then be rejected, but General tickets can still be bought at $15.

### Test cards

| Card number | Result |
|---|---|
| `4242 4242 4242 4242` | Approved (Visa) |
| `4000 0000 0000 0002` | Always declined |

Use any future expiry date (MM/YY) and a 3-digit CVC (4 digits for Amex).

### Resetting the discount counter

The `MCCVIBES` usage count is saved in your browser. To reset it, press `F12`, open the **Console** tab and run:

```js
localStorage.removeItem('mcc-discount-used-MCCVIBES')
```

Then reload the page.

## Ticket sales

### Ticket types and prices

| Ticket | Price | Sold online |
|---|---|---|
| Early Bird | $8 | May 12 – May 28, 2027 (1 month until 2 weeks before the festival) |
| General Admission | $15 | May 29 – June 11, 2027 (the last 2 weeks before the festival) |
| Senior | Free | May 12 – June 11, 2027 (the whole online sale period) |
| At the door | $18 | Festival day only, at the gate (not sold online) |

Rules:

- **Early Bird and General Admission are never on sale at the same time.** Early Bird is a campaign that ends the day General Admission starts.
- **Before May 12, 2027, all tickets are blocked.** The page shows when sales open.
- **From June 12, 2027 (festival day), online sales are closed.** Tickets are only available at the gate for $18.
- Maximum of **10 tickets per type in each order** (transaction). Buyers who need more can place another order.
- Quantities can be set with the − / + buttons or typed in.

### No ticket needed

- **Kids under 12** get in free. Their age is verified at the entrance.
- **Registered volunteers** get in free. They check in with festival staff at the entrance.

### How the sale dates work

All sale windows are calculated from one setting in the `<script>` section of `tickets.html`:

```js
const EVENT_DATE = new Date(2027, 5, 12); // months are 0-based, so 5 = June
```

| Setting | Value | Meaning |
|---|---|---|
| `SALES_OPEN` | `EVENT_DATE` minus 1 month | Early Bird and Senior go on sale |
| `GENERAL_START` | `EVENT_DATE` minus 14 days | Early Bird ends, General Admission starts |
| `SALES_CLOSE` | `EVENT_DATE` | Online sales end |

If the festival date changes, update `EVENT_DATE` only; all the other dates move with it. Prices and sale windows for each ticket are in the `TICKETS` list.

Tickets that are not on sale are greyed out and show "On sale <date>" or "Sale ended" instead of the quantity buttons. Sale dates are checked again when the buyer clicks Pay, so a page left open past a cutoff cannot sell an expired ticket.

### Testing a specific date

Add `?date=YYYY-MM-DD` to the URL to see the page as it would look on that day:

| URL | What you see |
|---|---|
| `tickets.html?date=2027-05-01` | Sales not open yet, all tickets blocked |
| `tickets.html?date=2027-05-20` | Early Bird + Senior on sale |
| `tickets.html?date=2027-05-30` | General Admission + Senior on sale |
| `tickets.html?date=2027-06-12` | Online sales closed |

### Discount codes

| Code | Discount | Works on | Available | Limit |
|---|---|---|---|---|
| `MCCVIBES` | 30% off ($15 → $10.50) | General Admission only | From May 29, 2027 (after Early Bird ends) | First 50 tickets |

Rules:

- The code only works while General Admission is on sale. During Early Bird, the page says it can be used from May 29.
- The 50-ticket limit is **only for the discount**, not for General Admission sales. Only tickets bought with the code count toward the 50; General tickets bought without the code never use it up, before or after the 50 are gone.
- The 50-ticket limit counts **tickets**, not orders. If 3 discounts are left and someone buys 5 General tickets, 3 get 30% off and 2 are full price.
- Tickets are only counted after a successful payment. Declined payments don't use up the discount.
- Once all 50 are used, the page shows "Sorry, all 50 MCCVIBES discounts have been used."
- Codes are not case-sensitive (`mccvibes` works too).

Codes are set in the `DISCOUNT_CODES` list in `tickets.html`:

```js
'MCCVIBES': { percent: 30, appliesTo: ['general'], limit: 50 },
```

#### Usage counter (demo limitation)

The site is static HTML with no server, so the count of used discounts is saved in the **buyer's browser** (`localStorage`). It survives page reloads and updates automatically after each purchase, but **each browser or device has its own count**. It is not shared between buyers.

To make the 50-ticket limit real, the counter needs a backend or database (for example Firebase or Supabase). Only two functions in `tickets.html` need to change: `getDiscountUsed()` and `addDiscountUsed()`.

To reset the counter while testing, run this in the browser console:

```js
localStorage.removeItem('mcc-discount-used-MCCVIBES')
```

### Checkout (demo)

The checkout is simulated. No real payment is made and card details never leave the browser.

- Card numbers are checked with the Luhn algorithm, and the card brand, expiry date and CVC are validated.
- Test card `4000 0000 0000 0002` is always declined, to demo a failed payment.
- Orders that total $0 (for example, Senior tickets only) skip the card form.
- Buyers can add an optional donation to the community fund.

## Contact

Email [info@mccollege.edu](mailto:info@mccollege.edu) or call (312) 236-9000.
