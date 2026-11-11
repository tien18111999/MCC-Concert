import { neon } from "@neondatabase/serverless";
import { DISCOUNT_CODES, MAX_PER_TYPE } from "@/lib/tickets";

export type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  consent: number;
  created_at: string;
};

export type VolunteerEntry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  affiliation: string;
  studentId: string;
  created_at: string;
};

const affiliations = new Set([
  "Current MCC Student",
  "MCC Alumni",
  "Faculty / Staff",
  "External / Community Volunteer",
]);

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

function isUnique(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

function stamp(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function isVolunteerAffiliation(value: string) {
  return affiliations.has(value);
}

export async function insertSignup(name: string, email: string) {
  try {
    await database()`
      insert into waitlist (name, email, consent)
      values (${name}, ${email}, true)
    `;
  } catch (error) {
    if (isUnique(error)) throw new Error("UNIQUE constraint failed");
    throw error;
  }
}

export async function listSignups(): Promise<WaitlistEntry[]> {
  const rows = await database()`
    select id, name, email, consent, created_at
    from waitlist
    order by created_at desc
  `;
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    consent: row.consent ? 1 : 0,
    created_at: stamp(row.created_at),
  }));
}

export async function clearSignups() {
  await database()`delete from waitlist`;
}

export async function insertVolunteer(entry: Omit<VolunteerEntry, "id" | "created_at">) {
  try {
    await database()`
      insert into volunteers (name, email, phone, affiliation, student_id)
      values (${entry.name}, ${entry.email}, ${entry.phone}, ${entry.affiliation}, ${entry.studentId})
    `;
  } catch (error) {
    if (isUnique(error)) throw new Error("UNIQUE constraint failed");
    throw error;
  }
}

export async function listVolunteers(): Promise<VolunteerEntry[]> {
  const rows = await database()`
    select id, name, email, phone, affiliation, student_id, created_at
    from volunteers
    order by created_at desc
  `;
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    affiliation: String(row.affiliation),
    studentId: String(row.student_id ?? ""),
    created_at: stamp(row.created_at),
  }));
}

export async function clearVolunteers() {
  await database()`delete from volunteers`;
}

export async function readDiscountUsed(code: string) {
  const rows = await database()`
    select tickets_used
    from discount_uses
    where code = ${code}
  `;
  return Math.max(0, Number(rows[0]?.tickets_used ?? 0));
}

export async function claimDiscount(code: string, count: number) {
  const rule = DISCOUNT_CODES[code];
  if (!rule) return null;
  const requested = Math.max(0, Math.min(MAX_PER_TYPE, Math.floor(count)));
  if (requested === 0) {
    return { used: await readDiscountUsed(code), applied: 0, limit: rule.limit };
  }
  const rows = await database()`
    with before as (
      select tickets_used from discount_uses where code = ${code}
    ),
    upd as (
      update discount_uses
      set tickets_used = least(${rule.limit}, tickets_used + ${requested})
      where code = ${code}
      returning tickets_used
    )
    select upd.tickets_used as used, upd.tickets_used - before.tickets_used as applied
    from upd, before
  `;
  return {
    used: Number(rows[0]?.used ?? 0),
    applied: Number(rows[0]?.applied ?? 0),
    limit: rule.limit,
  };
}
