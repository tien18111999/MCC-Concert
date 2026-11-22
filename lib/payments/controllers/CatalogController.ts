import { json, respond } from "../http";
import type { CatalogService } from "../services/CatalogService";

// Controllers handle HTTP only: parse the request, call a service, shape the response.
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  get = () => respond(() => json(this.catalogService.publicView()));
}
