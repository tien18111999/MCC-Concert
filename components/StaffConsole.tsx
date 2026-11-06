"use client";

import { FormEvent, useEffect, useState } from "react";

type Entry = {
  id: string;
  name: string;
  email: string;
  consent: number;
  created_at: string;
};

const STORAGE_KEY = "mcc-staff-key";

export function StaffConsole() {
  const [password, setPassword] = useState("");
  const [key, setKey] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  async function load(staffKey: string) {
    const response = await fetch("/api/waitlist", {
      headers: { "x-staff-key": staffKey },
      cache: "no-store",
    });
    const data = (await response.json()) as { entries?: Entry[]; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not open the waitlist.");
      setKey("");
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    setEntries(data.entries ?? []);
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

  function exportCsv() {
    const header = "Name,Email,Consent,Signed up";
    const lines = entries.map((entry) =>
      [entry.name, entry.email, entry.consent ? "yes" : "no", entry.created_at]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mcc-waitlist.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function clearList() {
    if (!key || !window.confirm("Clear every waitlist signup?")) return;
    const response = await fetch("/api/waitlist", {
      method: "DELETE",
      headers: { "x-staff-key": key },
    });
    if (!response.ok) {
      setError("Could not clear the waitlist.");
      return;
    }
    setEntries([]);
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-16 sm:px-8">
      <a href="/" className="text-sm text-white/50 hover:text-white">
        ← Back to the site
      </a>
      <h1 className="mt-6 font-display text-6xl text-white">Waitlist</h1>
      <p className="mt-2 text-sm text-white/55">
        Signups saved on this server. Password lives in STAFF_PASSWORD.
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
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/70">{entries.length} signup{entries.length === 1 ? "" : "s"}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => void clearList()}
                className="rounded-full border border-rose-400/40 px-4 py-2 text-sm text-rose-200"
              >
                Clear
              </button>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
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
                    <td colSpan={3} className="px-4 py-8 text-center text-white/45">
                      No signups yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-white/10">
                      <td className="px-4 py-3 text-white">{entry.name}</td>
                      <td className="px-4 py-3 text-white/80">{entry.email}</td>
                      <td className="px-4 py-3 text-white/50">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
