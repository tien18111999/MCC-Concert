import fs from "node:fs/promises";
import { buildCatalog, type Catalog } from "./config/catalog";
import { loadConfig, type AppConfig } from "./config";
import { CatalogController } from "./controllers/CatalogController";
import { DevController } from "./controllers/DevController";
import { DiscountController } from "./controllers/DiscountController";
import { PaymentController } from "./controllers/PaymentController";
import { ReportController } from "./controllers/ReportController";
import type { PaymentData } from "./models/Payment";
import { JsonFilePaymentRepository } from "./repositories/JsonFilePaymentRepository";
import type { PaymentRepository } from "./repositories/PaymentRepository";
import { CardValidator } from "./services/CardValidator";
import { CatalogService } from "./services/CatalogService";
import { DiscountService } from "./services/DiscountService";
import { MockCardProcessor } from "./services/MockCardProcessor";
import { MockDataService } from "./services/MockDataService";
import type { PaymentProcessor } from "./services/PaymentProcessor";
import { PaymentService } from "./services/PaymentService";
import { PricingService } from "./services/PricingService";
import { ReportService } from "./services/ReportService";
import { SalePolicy } from "./services/SalePolicy";

type Options = {
  config?: AppConfig;
  catalog?: Catalog;
  paymentRepository?: PaymentRepository;
  paymentProcessor?: PaymentProcessor;
  loadMockPayments?: () => Promise<PaymentData[]>;
};

// Composition root: the only place that picks concrete implementations.
// To change storage or the payment provider, swap the class here.
export function buildContainer(options: Options = {}) {
  const config = options.config ?? loadConfig();
  const catalog = options.catalog ?? buildCatalog();
  const paymentRepository = options.paymentRepository ?? new JsonFilePaymentRepository(config.dataFile);
  const paymentProcessor = options.paymentProcessor ?? new MockCardProcessor();
  const loadMockPayments =
    options.loadMockPayments ?? (async () => JSON.parse(await fs.readFile(config.mockFile, "utf8")) as PaymentData[]);

  const salePolicy = new SalePolicy();
  const discountService = new DiscountService(catalog, salePolicy, paymentRepository);
  const pricingService = new PricingService(catalog, salePolicy, discountService);
  const paymentService = new PaymentService(pricingService, new CardValidator(), paymentProcessor, paymentRepository);
  const reportService = new ReportService(catalog, paymentRepository);
  const mockDataService = new MockDataService(paymentRepository, loadMockPayments);

  return {
    catalogController: new CatalogController(new CatalogService(catalog)),
    paymentController: new PaymentController(paymentService, config),
    discountController: new DiscountController(discountService, config),
    reportController: new ReportController(reportService),
    devController: new DevController(mockDataService, config),
  };
}

export type Container = ReturnType<typeof buildContainer>;

// Next.js may load this module more than once (separate route bundles, hot reload). Keeping the
// container on globalThis guarantees one repository and one write queue per process.
const globalForContainer = globalThis as unknown as { mccContainer?: Container };

export function getContainer(): Container {
  globalForContainer.mccContainer ??= buildContainer();
  return globalForContainer.mccContainer;
}
