import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { clearVolunteers, insertVolunteer, isVolunteerAffiliation, listVolunteers } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function staffStatus(request: Request) {
  const expected = process.env.STAFF_PASSWORD;
  if (!expected) return "unconfigured" as const;
  const given = request.headers.get("x-staff-key") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length === 0 || a.length !== b.length || !timingSafeEqual(a, b)) {
    return "denied" as const;
  }
  return "ok" as const;
}

function denied(status: "unconfigured" | "denied") {
  if (status === "unconfigured") {
    return NextResponse.json({ error: "Staff access is not configured." }, { status: 503 });
  }
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, email, phone, affiliation, studentId } = body as {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    affiliation?: unknown;
    studentId?: unknown;
  };

  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 120) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (typeof email !== "string" || email.trim().length > 200 || !EMAIL.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (typeof phone !== "string" || phone.trim().length < 7 || phone.trim().length > 30) {
    return NextResponse.json({ error: "Please enter a phone number." }, { status: 400 });
  }
  if (typeof affiliation !== "string" || !isVolunteerAffiliation(affiliation)) {
    return NextResponse.json({ error: "Please choose your affiliation with MCC." }, { status: 400 });
  }
  const idValue = typeof studentId === "string" ? studentId.trim() : "";
  if (idValue.length > 40) {
    return NextResponse.json({ error: "Student ID is too long." }, { status: 400 });
  }

  try {
    await insertVolunteer({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      affiliation,
      studentId: idValue,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "This email is already registered as a volunteer." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not save your registration." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const status = staffStatus(request);
  if (status !== "ok") return denied(status);
  const entries = await listVolunteers();
  return NextResponse.json({ entries });
}

export async function DELETE(request: Request) {
  const status = staffStatus(request);
  if (status !== "ok") return denied(status);
  await clearVolunteers();
  return NextResponse.json({ ok: true });
}
