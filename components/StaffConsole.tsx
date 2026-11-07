"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";

type Entry = {
  id: string;
  name: string;
  email: string;
  consent: number;
  created_at: string;
};

type Volunteer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  affiliation: string;
  studentId: string;
  created_at: string;
};

const STORAGE_KEY = "mcc-staff-key";

export function StaffConsole() {
  const [password, setPassword] = useState("");
  const [key, setKey] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  async function load(staffKey: string) {
    const headers = { "x-staff-key": staffKey };
    const [waitlistResponse, volunteerResponse] = await Promise.all([
      fetch("/api/waitlist", { headers, cache: "no-store" }),
      fetch("/api/volunteers", { headers, cache: "no-store" }),
    ]);
    const waitlist = (await waitlistResponse.json()) as { entries?: Entry[]; error?: string };
    const volunteerData = (await volunteerResponse.json()) as { entries?: Volunteer[]; error?: string };
    if (!waitlistResponse.ok || !volunteerResponse.ok) {
      setError(waitlist.error ?? volunteerData.error ?? "Could not open the staff lists.");
      setKey("");
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    setEntries(waitlist.entries ?? []);
    setVolunteers(volunteerData.entries ?? []);
    setKey(staffKey);
    setError("");
    sessionStorage.setItem(STORAGE_KEY, staffKey);
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setReady(true);
      return;
    }
    void load(saved).finally(() => setReady(true));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await load(password);
  }

  function download(filename: string, header: string, lines: string[]) {
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const header = "Name,Email,Consent,Signed up";
    const lines = entries.map((entry) =>
      [entry.name, entry.email, entry.consent ? "yes" : "no", entry.created_at]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
    download("mcc-waitlist.csv", header, lines);
  }

  function exportVolunteers() {
    const header = "Name,Email,Phone,Affiliation,Student ID,Registered";
    const lines = volunteers.map((entry) =>
      [entry.name, entry.email, entry.phone, entry.affiliation, entry.studentId, entry.created_at]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
    download("mcc-volunteers.csv", header, lines);
  }

  async function clearList(kind: "waitlist" | "volunteers") {
    const label = kind === "waitlist" ? "waitlist signup" : "volunteer registration";
    if (!key || !window.confirm(`Clear every ${label}?`)) return;
    const response = await fetch(kind === "waitlist" ? "/api/waitlist" : "/api/volunteers", {
      method: "DELETE",
      headers: { "x-staff-key": key },
    });
    if (!response.ok) {
      setError(`Could not clear the ${label}s.`);
      return;
    }
    if (kind === "waitlist") setEntries([]);
    else setVolunteers([]);
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-16 sm:px-8">
      <a href="/" className="text-sm text-white/50 hover:text-white">
        ← Back to the site
      </a>
      <h1 className="mt-6 font-display text-6xl text-white">Staff</h1>
      <p className="mt-2 text-sm text-white/55">
        Waitlist signups and volunteer registrations are saved privately on this server. Download either list as a CSV. Password lives in STAFF_PASSWORD.
      </p>

      {!ready ? null : !key ? (
        <form onSubmit={onSubmit} className="mt-8 max-w-sm space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-white">Staff password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none"
            />
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <button
            type="submit"
            className="rounded-full bg-[#ff2d95] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Open list
          </button>
        </form>
      ) : (
        <section className="mt-8 space-y-10">
          <List
            title="Waitlist"
            countLabel={`${entries.length} signup${entries.length === 1 ? "" : "s"}`}
            onExport={exportCsv}
            onClear={() => void clearList("waitlist")}
            error={error}
          >
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Signed up</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-white/45">No signups yet.</td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-white/10">
                      <td className="px-4 py-3 text-white">{entry.name}</td>
                      <td className="px-4 py-3 text-white/80">{entry.email}</td>
                      <td className="px-4 py-3 text-white/50">{new Date(entry.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </List>
          <List
            title="Volunteers"
            countLabel={`${volunteers.length} registration${volunteers.length === 1 ? "" : "s"}`}
            onExport={exportVolunteers}
            onClear={() => void clearList("volunteers")}
          >
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Affiliation</th>
                  <th className="px-4 py-3 font-medium">Student ID</th>
                  <th className="px-4 py-3 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-white/45">No volunteers yet.</td>
                  </tr>
                ) : (
                  volunteers.map((entry) => (
                    <tr key={entry.id} className="border-t border-white/10">
                      <td className="px-4 py-3 text-white">{entry.name}</td>
                      <td className="px-4 py-3 text-white/80">{entry.email}</td>
                      <td className="px-4 py-3 text-white/80">{entry.phone}</td>
                      <td className="px-4 py-3 text-white/80">{entry.affiliation}</td>
                      <td className="px-4 py-3 text-white/50">{entry.studentId || "—"}</td>
                      <td className="px-4 py-3 text-white/50">{new Date(entry.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </List>
        </section>
      )}
    </main>
  );
}

function List({
  title,
  countLabel,
  onExport,
  onClear,
  error,
  children,
}: {
  title: string;
  countLabel: string;
  onExport: () => void;
  onClear: () => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-4xl text-white">{title}</h2>
          <p className="text-sm text-white/70">{countLabel}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onExport} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">
            Export CSV
          </button>
          <button type="button" onClick={onClear} className="rounded-full border border-rose-400/40 px-4 py-2 text-sm text-rose-200">
            Clear
          </button>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">{children}</div>
    </section>
  );
}
