import type { Context } from "hono";
import {
  listCitiesByCountry,
  listCountries,
  listLocationHierarchy,
  listNeighborhoodsByCity,
} from "./services/location-hierarchy.service";

export function getLocationHierarchy(c: Context) {
  try {
    const locations = listLocationHierarchy();
    return c.json({ locations });
  } catch (error) {
    console.error("Error fetching location hierarchy:", error);
    return c.json({ error: "Failed to fetch location hierarchy" }, 500);
  }
}

export function getCountries(c: Context) {
  try {
    const countries = listCountries();
    return c.json({ countries });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return c.json({ error: "Failed to fetch countries" }, 500);
  }
}

export function getCitiesByCountry(c: Context) {
  try {
    const country = c.req.param("country");
    if (!country) {
      return c.json({ error: "Country parameter required" }, 400);
    }

    const cities = listCitiesByCountry(country);
    return c.json({ cities });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return c.json({ error: "Failed to fetch cities" }, 500);
  }
}

export function getNeighborhoodsByCity(c: Context) {
  try {
    const country = c.req.param("country");
    const city = c.req.param("city");

    if (!country || !city) {
      return c.json({ error: "Country and city parameters required" }, 400);
    }

    const neighborhoods = listNeighborhoodsByCity(country, city);
    return c.json({ neighborhoods });
  } catch (error) {
    console.error("Error fetching neighborhoods:", error);
    return c.json({ error: "Failed to fetch neighborhoods" }, 500);
  }
}
