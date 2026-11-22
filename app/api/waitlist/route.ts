import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { clearSignups, insertSignup, listSignups } from "@/lib/db";

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
    return NextResponse.json(
      { error: "Staff access is not configured." },
      { status: 503 },
    );
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

  const { name, email, consent } = body as {
    name?: unknown;
    email?: unknown;
    consent?: unknown;
  };

  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 120) {
    return NextResponse.json(
      { error: "Please enter your full name." },
      { status: 400 },
    );
  }

  if (typeof email !== "string" || email.trim().length > 200 || !EMAIL.test(email.trim())) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 },
    );
  }

  if (consent !== true) {
    return NextResponse.json(
      { error: "Please agree to receive event updates." },
      { status: 400 },
    );
  }

  try {
    await insertSignup(name.trim(), email.trim().toLowerCase());
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "This email is already on the waitlist." },
        { status: 409 },
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Could not save your signup. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const status = staffStatus(request);
  if (status !== "ok") return denied(status);
  return NextResponse.json({ entries: await listSignups() });
}

export async function DELETE(request: Request) {
  const status = staffStatus(request);
  if (status !== "ok") return denied(status);
  await clearSignups();
  return NextResponse.json({ ok: true });
}
