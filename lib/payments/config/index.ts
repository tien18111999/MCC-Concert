import path from "node:path";

export type AppConfig = {
  dataFile: string;
  mockFile: string;
  allowSimulatedDate: boolean;
  enableDevEndpoints: boolean;
};

// Read when the container is built. Everything works in development and production.
export function loadConfig(): AppConfig {
  const root = process.cwd();
  return {
    // Outside public/, so it can never be downloaded.
    dataFile: process.env.DATA_FILE || path.join(root, "data", "payments.json"),
    mockFile: path.join(root, "lib", "payments", "mock", "mock-payments.json"),
    // ?date=YYYY-MM-DD / X-Simulated-Date: pretend it is another day (lets you test sale phases and buy before sales open).
    // On by default; set ALLOW_SIMULATED_DATE=false to turn it off.
    allowSimulatedDate: process.env.ALLOW_SIMULATED_DATE !== "false",
    // /api/test-charge (load fake data) and /api/refresh (delete all payments). On by default;
    // set ENABLE_DEV_ENDPOINTS=false to turn them off.
    enableDevEndpoints: process.env.ENABLE_DEV_ENDPOINTS !== "false",
  };
}
