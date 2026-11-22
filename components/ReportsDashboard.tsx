"use client";

import { Chart, registerables, type ChartConfiguration } from "chart.js";
import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/tickets";

Chart.register(...registerables);
Chart.defaults.color = "rgba(255,255,255,0.65)";
Chart.defaults.borderColor = "rgba(255,255,255,0.1)";

type Report = {
  options: { cardBrands: string[]; statuses: string[]; ticketTypes: { id: string; name: string }[] };
  summary: {
    orders: number;
    approvedOrders: number;
    declinedOrders: number;
    ticketsSold: number;
    discountedOrders: number;
    discountedTickets: number;
    revenue: number;
    discounts: number;
    donations: number;
    processorFees: number;
    netRevenue: number;
  };
  byCardBrand: { brand: string; orders: number; tickets: number; revenue: number }[];
  byTicketType: { id: string; name: string; tickets: number; revenue: number }[];
  byDiscount: { label: string; orders: number; tickets: number; revenue: number }[];
  byDiscountCode: { code: string; orders: number; discountedTickets: number; discountAmount: number }[];
  byStatus: { status: string; count: number }[];
  overTime: { date: string; revenue: number; tickets: number }[];
  recent: {
    orderId: string;
    createdAt: string;
    status: string;
    cardBrand: string;
    cardLast4: string | null;
    total: number;
    discount: number;
    discountCode: string | null;
    discountedQty: number;
    lines: { name: string; quantity: number }[];
  }[];
};

type Filters = { cardBrand: string; status: string; ticketType: string; discountUsed: string; from: string; to: string };
const noFilters: Filters = { cardBrand: "", status: "", ticketType: "", discountUsed: "", from: "", to: "" };

const PALETTE = ["#ff2d95", "#ffc857", "#38bdf8", "#a78bfa", "#34d399", "#fb7185"];
const STATUS_COLORS: Record<string, string> = { Approved: "#34d399", Declined: "#fb7185" };

const fieldClass = "mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm font-normal text-white outline-none focus:border-[#ff2d95]";

// The calendars cover the festival year, so they open on January 2027 and every 2027 date can be picked.
const FESTIVAL_YEAR_START = "2027-01-01";
const FESTIVAL_YEAR_END = "2027-12-31";

// Dark calendar popup and a clickable calendar icon; clicking anywhere in the field opens the calendar.
const dateClass = `${fieldClass} cursor-pointer [color-scheme:dark]`;
const openCalendar = (event: React.MouseEvent<HTMLInputElement>) => {
  try {
    event.currentTarget.showPicker();
  } catch {
    /* Older browsers: the field still accepts typing. */
  }
};

function ChartCanvas({ config, label }: { config: ChartConfiguration; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const chart = new Chart(canvas.current, config);
    return () => chart.destroy();
  }, [config]);
  return (
    <div className="h-64">
      <canvas ref={canvas} role="img" aria-label={label} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <figcaption className="mb-3 font-semibold text-white">{title}</figcaption>
      {children}
    </figure>
  );
}

export function ReportsDashboard() {
  const [filters, setFilters] = useState<Filters>(noFilters);
  const [report, setReport] = useState<Report | null>(null);
  const [options, setOptions] = useState<Report["options"] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
    let cancelled = false;
    fetch(`/api/reports?${query}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Request failed");
        return data as Report;
      })
      .then((data) => {
        if (cancelled) return;
        setReport(data);
        setOptions((current) => current ?? data.options); // dropdown values are filled once
        setError("");
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(`Could not load the report: ${reason.message}`);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const set = (key: keyof Filters) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((current) => ({ ...current, [key]: event.target.value }));

  const kpis = report
    ? [
        ["Revenue", money(report.summary.revenue)],
        ["Tickets sold", String(report.summary.ticketsSold)],
        ["Orders (approved / declined)", `${report.summary.approvedOrders} / ${report.summary.declinedOrders}`],
        ["Discounted tickets", `${report.summary.discountedTickets} (${report.summary.discountedOrders} orders)`],
        ["Discounts given", money(report.summary.discounts)],
        ["Donations", money(report.summary.donations)],
        ["Net after fees", money(report.summary.netRevenue)],
      ]
    : [];

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-16 sm:px-8">
      <a href="/" className="text-sm text-white/50 hover:text-white">
        ← Back to the site
      </a>
      <h1 className="mt-6 font-display text-6xl text-white">Online ticket sales</h1>
      <p className="mt-2 text-sm text-white/55">Revenue and ticket counts include approved payments only. Demo data from the checkout page.</p>

      <form className="mt-8 grid grid-cols-2 items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-7" onSubmit={(event) => event.preventDefault()}>
        <label className="text-xs font-semibold text-white/60">
          Card type
          <select value={filters.cardBrand} onChange={set("cardBrand")} className={fieldClass}>
            <option value="">All</option>
            {options?.cardBrands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-white/60">
          Status
          <select value={filters.status} onChange={set("status")} className={fieldClass}>
            <option value="">All</option>
            {options?.statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-white/60">
          Ticket type
          <select value={filters.ticketType} onChange={set("ticketType")} className={fieldClass}>
            <option value="">All</option>
            {options?.ticketTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-white/60">
          Discount
          <select value={filters.discountUsed} onChange={set("discountUsed")} className={fieldClass}>
            <option value="">All</option>
            <option value="yes">Discount used</option>
            <option value="no">No discount</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-white/60">
          From
          <input type="date" value={filters.from} min={FESTIVAL_YEAR_START} max={filters.to || FESTIVAL_YEAR_END} onChange={set("from")} onClick={openCalendar} className={dateClass} />
        </label>
        <label className="text-xs font-semibold text-white/60">
          To
          <input type="date" value={filters.to} min={filters.from || FESTIVAL_YEAR_START} max={FESTIVAL_YEAR_END} onChange={set("to")} onClick={openCalendar} className={dateClass} />
        </label>
        <button type="button" onClick={() => setFilters(noFilters)} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15">
          Reset
        </button>
      </form>

      {error ? <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

      {report ? (
        <>
          <section aria-label="Summary" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-white/55">{label}</p>
                <p className="mt-1 font-display text-4xl text-white">{value}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card title="Revenue by card type">
              <ChartCanvas
                label="Revenue by card type"
                config={{
                  type: "bar",
                  data: {
                    labels: report.byCardBrand.map((row) => row.brand),
                    datasets: [{ label: "Revenue", data: report.byCardBrand.map((row) => row.revenue / 100), backgroundColor: PALETTE[0] }],
                  },
                  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (value) => `$${value}` } } } },
                }}
              />
            </Card>
            <Card title="Tickets sold by type">
              <ChartCanvas
                label="Tickets sold by type"
                config={{
                  type: "doughnut",
                  data: { labels: report.byTicketType.map((row) => row.name), datasets: [{ data: report.byTicketType.map((row) => row.tickets), backgroundColor: PALETTE, borderColor: "#000" }] },
                  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
                }}
              />
            </Card>
            <Card title="Revenue over time">
              <ChartCanvas
                label="Revenue over time"
                config={{
                  type: "line",
                  data: {
                    labels: report.overTime.map((row) => row.date),
                    datasets: [{ label: "Revenue", data: report.overTime.map((row) => row.revenue / 100), borderColor: PALETTE[0], backgroundColor: PALETTE[0], tension: 0.25 }],
                  },
                  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (value) => `$${value}` } } } },
                }}
              />
            </Card>
            <Card title="Approved vs. declined">
              <ChartCanvas
                label="Approved versus declined payments"
                config={{
                  type: "doughnut",
                  data: {
                    labels: report.byStatus.map((row) => row.status),
                    datasets: [{ data: report.byStatus.map((row) => row.count), backgroundColor: report.byStatus.map((row) => STATUS_COLORS[row.status] ?? PALETTE[5]), borderColor: "#000" }],
                  },
                  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
                }}
              />
            </Card>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold text-white">
              Latest payments <span className="text-xs font-normal text-white/40">(up to 50)</span>
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-white/45">
                  <tr>
                    <th className="py-2 pr-4">Date</th>
                    <th className="pr-4">Order</th>
                    <th className="pr-4">Tickets</th>
                    <th className="pr-4">Card</th>
                    <th className="pr-4">Discount</th>
                    <th className="pr-4">Status</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/80">
                  {report.recent.map((payment) => (
                    <tr key={payment.orderId}>
                      <td className="py-2 pr-4">{new Date(payment.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td className="pr-4 font-mono text-xs">{payment.orderId}</td>
                      <td className="pr-4">{payment.lines.map((line) => `${line.quantity} × ${line.name}`).join(", ")}</td>
                      <td className="pr-4">{payment.cardLast4 ? `${payment.cardBrand} ···· ${payment.cardLast4}` : "None (free)"}</td>
                      <td className="pr-4">{payment.discountedQty > 0 && payment.discountCode ? `${payment.discountCode} · ${payment.discountedQty} × · −${money(payment.discount)}` : "None"}</td>
                      <td className={`pr-4 font-semibold ${payment.status === "Approved" ? "text-emerald-300" : "text-rose-300"}`}>{payment.status}</td>
                      <td className="text-right font-semibold">{money(payment.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {report.recent.length === 0 ? <p className="py-4 text-sm italic text-white/40">No payments match these filters.</p> : null}
          </section>
        </>
      ) : null}
    </main>
  );
}
