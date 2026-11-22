import type { AppConfig } from "../config";
import { NotFoundError } from "../errors/AppError";
import { json, respond } from "../http";
import type { MockDataService } from "../services/MockDataService";

// Testing tools. They overwrite or delete data, so they only exist when enabled in config.
export class DevController {
  constructor(
    private readonly mockDataService: MockDataService,
    private readonly config: AppConfig,
  ) {}

  testCharge = () =>
    respond(async () => {
      this.assertEnabled();
      return json({ message: "Mock payments loaded.", ...(await this.mockDataService.loadMock()) });
    });

  refresh = () =>
    respond(async () => {
      this.assertEnabled();
      await this.mockDataService.reset();
      return json({ message: "Data file deleted and recreated empty.", totalPayments: 0 });
    });

  private assertEnabled() {
    if (!this.config.enableDevEndpoints) throw new NotFoundError();
  }
}
