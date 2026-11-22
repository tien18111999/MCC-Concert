import { AppError, ValidationError } from "./errors/AppError";
import { isDay } from "./utils";

export const json = (data: unknown, status = 200) => Response.json(data, { status });

/** Runs a handler and turns thrown AppErrors into JSON error responses. */
export async function respond(handler: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof AppError) return json({ error: error.message }, error.status);
    // Never log request bodies: they contain card data.
    console.error(error instanceof Error ? error.message : "Unexpected error");
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Invalid JSON.");
  }
}

/**
 * The moment used for sale windows. Outside production, a `?date=YYYY-MM-DD` query parameter or an
 * `X-Simulated-Date: YYYY-MM-DD` header (the ticket page's ?date= test links send the header)
 * overrides the real clock so sale phases can be tested. The query parameter wins if both are sent.
 */
export function requestNow(request: Request, allowSimulatedDate: boolean): Date {
  const value = new URL(request.url).searchParams.get("date") ?? request.headers.get("x-simulated-date");
  if (allowSimulatedDate && isDay(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d, 12);
  }
  return new Date();
}
