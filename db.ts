import { Database } from "bun:sqlite";

const db = new Database("locations.sqlite");

// Initialize the table
db.run(`
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    url TEXT NOT NULL,
    embed_code TEXT,
    images TEXT,
    lat REAL,
    lng REAL,
    original_image_urls TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, address)
  )
`);

// Add images column if it doesn't exist (migration)
try {
  db.run("ALTER TABLE locations ADD COLUMN images TEXT");
} catch (e) {
  // Column likely already exists, ignore error
}

// Add lat/lng columns if they don't exist (migration)
try {
    db.run("ALTER TABLE locations ADD COLUMN lat REAL");
    db.run("ALTER TABLE locations ADD COLUMN lng REAL");
} catch (e) {
    // Columns likely already exist
}

// Add original_image_urls column (migration)
try {
    db.run("ALTER TABLE locations ADD COLUMN original_image_urls TEXT");
} catch (e) {
    // Column likely already exists
}

export interface LocationEntry {
  name: string;
  address: string;
  url: string;
  embed_code?: string;
  images?: string[];
  original_image_urls?: string[];
  lat?: number | null;
  lng?: number | null;
}

export function saveLocation(location: LocationEntry) {
  try {
    const query = db.query(`
      INSERT INTO locations (name, address, url, embed_code, images, lat, lng, original_image_urls)
      VALUES ($name, $address, $url, $embed_code, $images, $lat, $lng, $original_image_urls)
      ON CONFLICT(name, address) DO UPDATE SET
        url = excluded.url,
        embed_code = excluded.embed_code,
        images = excluded.images,
        lat = excluded.lat,
        lng = excluded.lng,
        original_image_urls = excluded.original_image_urls,
        created_at = CURRENT_TIMESTAMP
    `);
    
    query.run({
      $name: location.name,
      $address: location.address,
      $url: location.url,
      $embed_code: location.embed_code || null,
      $images: location.images ? JSON.stringify(location.images) : null,
      $lat: location.lat || null,
      $lng: location.lng || null,
      $original_image_urls: location.original_image_urls ? JSON.stringify(location.original_image_urls) : null
    });
    return true;
  } catch (error) {
    console.error("Error saving location to DB:", error);
    return false;
  }
}

export function getAllLocations(): LocationEntry[] {
  const query = db.query("SELECT name, address, url, embed_code, images, lat, lng, original_image_urls FROM locations ORDER BY created_at DESC");
  const rows = query.all() as any[];
  
  return rows.map(row => ({
    ...row,
    images: row.images ? JSON.parse(row.images) : [],
    original_image_urls: row.original_image_urls ? JSON.parse(row.original_image_urls) : []
  }));
}

export function closeDb() {
  db.close();
}

export function clearDatabase() {
  try {
    db.run("DELETE FROM locations");
    // Optionally vacuum to reclaim space
    db.run("VACUUM");
    return true;
  } catch (error) {
    console.error("Error clearing database:", error);
    return false;
  }
}
