import { getContainer } from "@/lib/payments/container";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export const GET = async (request: Request, { params }: { params: Promise<{ code: string }> }) =>
  getContainer().discountController.check(request, (await params).code);
