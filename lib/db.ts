import { neon } from "@neondatabase/serverless";

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
