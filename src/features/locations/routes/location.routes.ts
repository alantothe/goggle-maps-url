import { prefixMatcher, pathMatcher, type RouteDefinition } from "../../../shared/http/server";
import {
  getLocations,
  postAddInstagram,
  postAddMaps,
  postAddUpload,
  postOpenFolder,
  postUpdateMaps,
  serveImage,
} from "../controllers/location.controller";
import {
  getLocationTaxonomy,
  getCountries,
  getCitiesByCountry,
  getNeighborhoodsByCity,
} from "../controllers/location-taxonomy.controller";

export function getLocationRoutes(): RouteDefinition[] {
  return [
    { method: "GET", match: pathMatcher("/api/locations"), handler: getLocations },
    { method: "POST", match: pathMatcher("/api/add-maps"), handler: postAddMaps },
    { method: "POST", match: pathMatcher("/api/update-maps"), handler: postUpdateMaps },
    { method: "POST", match: pathMatcher("/api/add-instagram"), handler: postAddInstagram },
    { method: "POST", match: pathMatcher("/api/add-upload"), handler: postAddUpload },
    { method: "POST", match: pathMatcher("/api/open-folder"), handler: postOpenFolder },
    // Location Taxonomy API routes
    { method: "GET", match: pathMatcher("/api/location-taxonomy"), handler: getLocationTaxonomy },
    { method: "GET", match: pathMatcher("/api/location-taxonomy/countries"), handler: getCountries },
    { method: "GET", match: (url: URL) => url.pathname.startsWith("/api/location-taxonomy/cities/"), handler: getCitiesByCountry },
    { method: "GET", match: (url: URL) => url.pathname.startsWith("/api/location-taxonomy/neighborhoods/"), handler: getNeighborhoodsByCity },
    // Serve uploaded images
    {
      method: "GET",
      match: prefixMatcher("/src/data/images/"),
      handler: (_req, url) => serveImage(url.pathname),
    },
  ];
}
