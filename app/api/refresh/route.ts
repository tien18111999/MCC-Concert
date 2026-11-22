import { getContainer } from "@/lib/payments/container";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


// GET and POST both work so it can be opened from a browser address bar.
export const GET = () => getContainer().devController.refresh();
export const POST = GET;
