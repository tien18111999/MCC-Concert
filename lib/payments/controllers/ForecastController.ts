import { json, readJson, respond } from "../http";
import { ForecastRequest } from "../models/ForecastRequest";
import type { ForecastService } from "../services/ForecastService";

export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  assumptions = () => respond(() => json(this.forecastService.assumptions()));

  calculate = (request: Request) =>
    respond(async () => json(this.forecastService.calculate(ForecastRequest.parse(await readJson(request)))));

  random = () => respond(() => json(this.forecastService.random()));
}
