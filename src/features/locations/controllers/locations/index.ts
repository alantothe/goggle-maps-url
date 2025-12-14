import type { Context } from "hono";
import { listLocations } from "./services/location-query.service";

export function getLocations(c: Context) {
  try {
    const locations = listLocations();
    const cwd = process.cwd();
    return c.json({ locations, cwd });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return c.json({ error: "Failed to fetch locations" }, 500);
  }
}
