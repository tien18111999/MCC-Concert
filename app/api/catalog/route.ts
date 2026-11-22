import { getContainer } from "@/lib/payments/container";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export const GET = () => getContainer().catalogController.get();
