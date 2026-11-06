import { createHash } from "node:crypto";
import { del, get, list, put } from "@vercel/blob";

export type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  consent: number;
  created_at: string;
};

function pathnameFor(email: string) {
  const id = createHash("sha256").update(email).digest("hex");
  return `waitlist/${id}.json`;
}

function isDuplicate(error: unknown) {
  return error instanceof Error && /already exists/i.test(error.message);
}

export async function insertSignup(name: string, email: string) {
  const entry: WaitlistEntry = {
    id: crypto.randomUUID(),
    name,
    email,
    consent: 1,
    created_at: new Date().toISOString(),
  };

  try {
    await put(pathnameFor(email), JSON.stringify(entry), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
    });
  } catch (error) {
    if (isDuplicate(error)) {
      throw new Error("UNIQUE constraint failed");
    }
    throw error;
  }
}

async function readEntry(url: string) {
  const result = await get(url, { access: "private" });
  if (!result || result.statusCode !== 200) return null;
  const text = await new Response(result.stream).text();
  const parsed = JSON.parse(text) as WaitlistEntry;
  return {
    id: String(parsed.id),
    name: String(parsed.name),
    email: String(parsed.email),
    consent: Number(parsed.consent),
    created_at: String(parsed.created_at),
  };
}

export async function listSignups(): Promise<WaitlistEntry[]> {
  const entries: WaitlistEntry[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({ prefix: "waitlist/", cursor, limit: 1000 });
    const rows = await Promise.all(page.blobs.map((blob) => readEntry(blob.url)));
    for (const row of rows) {
      if (row) entries.push(row);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return entries.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function clearSignups() {
  let cursor: string | undefined;

  do {
    const page = await list({ prefix: "waitlist/", cursor, limit: 1000 });
    if (page.blobs.length > 0) {
      await del(page.blobs.map((blob) => blob.url));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
