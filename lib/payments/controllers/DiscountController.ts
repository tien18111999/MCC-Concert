import type { AppConfig } from "../config";
import { json, requestNow, respond } from "../http";
import type { DiscountService } from "../services/DiscountService";

export class DiscountController {
  constructor(
    private readonly discountService: DiscountService,
    private readonly config: AppConfig,
  ) {}

  check = (request: Request, code: string) =>
    respond(async () => json(await this.discountService.check(code, requestNow(request, this.config.allowSimulatedDate))));
}
