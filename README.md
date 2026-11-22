# MCC Turn It Up: Community Music Festival

The website for **MCC Turn It Up**, the Community Music & Family Festival hosted by **Midwestern Career College (MCC)**. A one-day neighborhood celebration of local music, food and family fun for 500 to 700 neighbors. Every dollar raised through donations, sponsorships and vendor partnerships goes to the community fund.

- **Date:** Saturday, June 12, 2027 · 12:00 PM – 8:00 PM
- **Location:** Columbus Park, 500 S Central Ave, Chicago
- **Hosted by:** Midwestern Career College
- **Contact:** [info@mccollege.edu](mailto:info@mccollege.edu) · (312) 236-9000 · Instagram [@mcc.turnitup](https://www.instagram.com/mcc.turnitup/)

## What's at the festival

- **Live Community Stage:** 8 hours of entertainment with 4 local bands and musicians, plus a live DJ.
- **Local Food Court:** 5–6 local food vendors.
- **Interactive Kids Zone:** face painting, balloon artists, arts and crafts, and lawn games.
- **Glow & Groove Finale:** the evening closing show.
- **21+ Beer Area:** fenced, with ID required.
- **Accessibility:** ADA-compliant restrooms, and staff at the First Aid & Info HQ can help with any needs.

## The website

| Page | What it does |
|---|---|
| Home `/` | About the festival and its highlights |
| Lineup & Schedule `/lineup`, `/schedule` | Who plays and when, with the lineup poster |
| Vendors `/vendors` | Food trucks and partner booths |
| Map `/map` | Site map and a trip planner for getting to Columbus Park |
| Tickets `/tickets` | Buy tickets online, with a discount code, an optional donation to the community fund and card checkout |
| Volunteer `/volunteer` | Volunteer sign-up |
| Sponsorships `/sponsorships` | Sponsor information and logos |
| Updates waitlist | Sign up to hear first about the ticket drop |
| Staff `/staff` | Password-protected waitlist and volunteer lists (CSV export) |
| Sales report `/reports` | For organizers: charts and a table of online ticket sales, filterable by card type, status, ticket type and dates |

## Tickets

| Ticket | Price | Sold online |
|---|---|---|
| Early Bird | $8 | May 12 – May 28, 2027 |
| General Admission | $15 | May 29 – June 11, 2027 |
| Senior | Free | May 12 – June 11, 2027 |
| At the door | $18 | Festival day only, at the gate |

- Early Bird and General Admission are never on sale at the same time.
- Up to 10 tickets of each type per order.
- **Kids under 12** and **registered volunteers** get in free and don't need a ticket.
- Discount code **MCCVIBES** gives 30% off General Admission for the first 50 discounted tickets.
- Online checkout is a demo: no real charge is made.

## Running it

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. If port 3000 is busy, Next.js uses the next free one and prints it (for example 3001); use that port in every URL below.

## Running the backend

The payments backend is part of the same Next.js app, so there is nothing separate to start: `npm run dev` runs the site and the API together. The code is in `lib/payments/` and the routes are in `app/api/`.

1. Start it with `npm run dev`.
2. Check it works: open http://localhost:3000/api/catalog. You should see the ticket list as JSON.
3. Try the ticket page with a sale date that is open: http://localhost:3000/tickets?date=2027-05-30 (sales open May 12, 2027, so without `?date=` nothing can be bought yet).
4. Fill the sales report with fake data: open http://localhost:3000/api/test-charge, then http://localhost:3000/reports.
5. Start again from zero at any time: open http://localhost:3000/api/refresh.

Payments are saved in `data/payments.json`, which is created by the first payment (or by `/api/refresh`). No database setup is needed for payments.

| Command | What it does |
|---|---|
| `npm run dev` | Runs the site and the backend in development mode |
| `npm test` | Runs the backend tests |
| `npm run mock:generate` | Rebuilds the fake payments file used by `/api/test-charge` |

Notes:

- `/api/test-charge`, `/api/refresh` and the `?date=` test dates only work in development mode. After `npm run build` + `npm start` they are switched off (set `ENABLE_DEV_ENDPOINTS=true` to keep the two endpoints on).
- Changes under `lib/payments/` need the dev server restarted to take effect.
- The waitlist, volunteer and staff pages need `DATABASE_URL` and `STAFF_PASSWORD` in `.env.local` (copy `.env.example`). Tickets and the sales report need no setup.

Every endpoint, with Postman examples and a ready-to-import collection, is documented in [lib/payments/docs/README.md](lib/payments/docs/README.md).
