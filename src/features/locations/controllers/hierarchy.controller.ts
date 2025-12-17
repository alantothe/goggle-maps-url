import type { Context } from "hono";
import { BadRequestError } from "../../../shared/core/errors/http-error";
import {
  getAllLocationHierarchy,
  getCitiesByCountry as getCitiesByCountryRepo,
  getCountries as getCountriesRepo,
  getNeighborhoodsByCity as getNeighborhoodsByCityRepo,
} from "../repositories/location-hierarchy.repository";

export function getLocationHierarchy(c: Context) {
  const locations = getAllLocationHierarchy();
  return c.json({ locations });
}

export function getCountries(c: Context) {
  const countries = getCountriesRepo();
  return c.json({ countries });
}

export function getCitiesByCountry(c: Context) {
  const country = c.req.param("country");
  if (!country) {
    throw new BadRequestError("Country parameter required");
  }

  const cities = getCitiesByCountryRepo(country);
  return c.json({ cities });
}

export function getNeighborhoodsByCity(c: Context) {
  const country = c.req.param("country");
  const city = c.req.param("city");

  if (!country || !city) {
    throw new BadRequestError("Country and city parameters required");
  }

  const neighborhoods = getNeighborhoodsByCityRepo(country, city);
  return c.json({ neighborhoods });
}
