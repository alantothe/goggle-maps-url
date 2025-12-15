import { app } from "../../../shared/http/server";
import { getLocations } from "../controllers/locations";
import { postAddMaps, postUpdateMaps } from "../controllers/maps";
import { postAddInstagram } from "../controllers/instagram";
import { postAddUpload } from "../controllers/uploads";
import { postOpenFolder, serveImage } from "../controllers/files";
import {
  getLocationHierarchy,
  getCountries,
  getCitiesByCountry,
  getNeighborhoodsByCity,
} from "../controllers/location-hierarchy";
import { clearDatabase } from "../controllers/clear-db";

// Location routes
app.get("/api/locations", getLocations);
app.post("/api/add-maps", postAddMaps);
app.post("/api/update-maps", postUpdateMaps);
app.post("/api/add-instagram", postAddInstagram);
app.post("/api/add-upload", postAddUpload);
app.post("/api/open-folder", postOpenFolder);
app.get("/api/clear-db", clearDatabase);

// Location hierarchy API routes (legacy taxonomy paths kept for compatibility)
app.get("/api/location-hierarchy", getLocationHierarchy);
app.get("/api/location-hierarchy/countries", getCountries);
app.get("/api/location-hierarchy/cities/:country", getCitiesByCountry);
app.get("/api/location-hierarchy/neighborhoods/:country/:city", getNeighborhoodsByCity);
app.get("/api/location-taxonomy", getLocationHierarchy);
app.get("/api/location-taxonomy/countries", getCountries);
app.get("/api/location-taxonomy/cities/:country", getCitiesByCountry);
app.get("/api/location-taxonomy/neighborhoods/:country/:city", getNeighborhoodsByCity);

// Serve uploaded images
app.get("/src/data/images/*", serveImage);
