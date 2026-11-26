import { getContainer } from "@/lib/payments/container";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET and POST both work so it can be opened from a browser address bar.
export const GET = () => getContainer().forecastController.random();
export const POST = GET;
