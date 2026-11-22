import path from "node:path";

export type AppConfig = {
  dataFile: string;
  mockFile: string;
  allowSimulatedDate: boolean;
  enableDevEndpoints: boolean;
};

// Read when the container is built. `next dev` is not production; `next build` / `next start` are.
export function loadConfig(): AppConfig {
  const isProduction = process.env.NODE_ENV === "production";
  const root = process.cwd();
  return {
    // Outside public/, so it can never be downloaded.
    dataFile: process.env.DATA_FILE || path.join(root, "data", "payments.json"),
    mockFile: path.join(root, "lib", "payments", "mock", "mock-payments.json"),
    // Lets the ticket page's ?date=YYYY-MM-DD test flow work. Never honored in production.
    allowSimulatedDate: !isProduction,
    // /api/test-charge and /api/refresh overwrite or delete the data file, so they are off in production.
    enableDevEndpoints: process.env.ENABLE_DEV_ENDPOINTS === "true" || !isProduction,
  };
}
