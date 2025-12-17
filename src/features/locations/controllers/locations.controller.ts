import type { Context } from "hono";
import { ServiceContainer } from "../container/service-container";

const container = ServiceContainer.getInstance();

export function getLocations(c: Context) {
  const locations = container.locationQueryService.listLocations();
  const cwd = process.cwd();
  return c.json({ locations, cwd });
}
