import { NextResponse } from "next/server";
import { claimDiscount, readDiscountUsed } from "@/lib/db";
import { DISCOUNT_CODES } from "@/lib/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function knownCode(value: unknown) {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  if (!Object.prototype.hasOwnProperty.call(DISCOUNT_CODES, code)) return null;
  return code;
}

export async function GET(request: Request) {
  const code = knownCode(new URL(request.url).searchParams.get("code"));
  if (!code) return NextResponse.json({ error: "That code is not valid." }, { status: 400 });
  const used = await readDiscountUsed(code);
  const limit = DISCOUNT_CODES[code].limit;
  return NextResponse.json({ code, used, limit, remaining: Math.max(0, limit - used) });
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
  const { code: rawCode, count } = body as { code?: unknown; count?: unknown };
  const code = knownCode(rawCode);
  if (!code || typeof count !== "number" || !Number.isFinite(count)) {
    return NextResponse.json({ error: "That code is not valid." }, { status: 400 });
  }
  const result = await claimDiscount(code, count);
  if (!result) return NextResponse.json({ error: "That code is not valid." }, { status: 400 });
  return NextResponse.json({ code, ...result, remaining: Math.max(0, result.limit - result.used) });
}
