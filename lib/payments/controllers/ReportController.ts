import { ValidationError } from "../errors/AppError";
import { json, respond } from "../http";
import type { ReportService } from "../services/ReportService";
import { isDay } from "../utils";

export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  get = (request: Request) =>
    respond(async () => {
      const params = new URL(request.url).searchParams;
      const text = (name: string) => params.get(name) || undefined;
      for (const name of ["from", "to"]) {
        const value = text(name);
        if (value && !isDay(value)) throw new ValidationError(`"${name}" must be YYYY-MM-DD.`);
      }
      const discountUsed = text("discountUsed");
      if (discountUsed && discountUsed !== "yes" && discountUsed !== "no") {
        throw new ValidationError('"discountUsed" must be yes or no.');
      }
      return json(
        await this.reportService.build({
          cardBrand: text("cardBrand"),
          status: text("status"),
          ticketType: text("ticketType"),
          discountUsed: discountUsed,
          from: text("from"),
          to: text("to"),
        }),
      );
    });
}
