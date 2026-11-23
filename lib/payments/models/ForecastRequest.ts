import { ValidationError } from "../errors/AppError";

export const FORECAST_FIELDS = ["earlyBird", "general", "discounted", "atDoor", "vendors"] as const;
export type ForecastField = (typeof FORECAST_FIELDS)[number];
export type ForecastInput = Record<ForecastField, number>;

// Parses the body of POST /api/forecast: five whole numbers, all optional (missing = 0).
// Business limits (capacity, discount limit, vendor maximum) are checked by ForecastService.
export class ForecastRequest {
  static parse(body: unknown): ForecastInput {
    if (!body || typeof body !== "object") throw new ValidationError("Invalid request.");
    const raw = body as Record<string, unknown>;
    const input = {} as ForecastInput;
    for (const field of FORECAST_FIELDS) {
      const value = raw[field] ?? 0;
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new ValidationError(`"${field}" must be a whole number, 0 or more.`);
      }
      input[field] = value;
    }
    return input;
  }
}
