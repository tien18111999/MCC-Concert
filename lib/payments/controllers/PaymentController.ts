import type { AppConfig } from "../config";
import { json, readJson, requestNow, respond } from "../http";
import { CheckoutRequest } from "../models/CheckoutRequest";
import type { PaymentService } from "../services/PaymentService";

export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly config: AppConfig,
  ) {}

  create = (request: Request) =>
    respond(async () => {
      const checkout = CheckoutRequest.parse(await readJson(request));
      const payment = await this.paymentService.checkout(checkout, requestNow(request, this.config.allowSimulatedDate));
      // A declined card is a normal outcome (recorded and returned), not an HTTP error.
      return json(payment.toJSON(), 201);
    });
}
