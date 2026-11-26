import { getContainer } from "@/lib/payments/container";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = () => getContainer().forecastController.assumptions();
export const POST = (request: Request) => getContainer().forecastController.calculate(request);
