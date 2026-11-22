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

Then open http://localhost:3000. (If port 3000 is busy, Next.js prints the port it used.) Copy `.env.example` to `.env.local` and fill it in if you want the waitlist, volunteer list and staff page to work; the tickets page and sales report need no setup.

The payments and reporting backend is described in [lib/payments/docs/README.md](lib/payments/docs/README.md).
