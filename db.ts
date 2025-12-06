import { Database } from "bun:sqlite";

const db = new Database("locations.sqlite");

// Initialize the table
db.run(`
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, address)
  )
`);

export interface LocationEntry {
  name: string;
  address: string;
  url: string;
}

export function saveLocation(location: LocationEntry) {
  try {
    const query = db.query(`
      INSERT INTO locations (name, address, url)
      VALUES ($name, $address, $url)
      ON CONFLICT(name, address) DO UPDATE SET
        url = excluded.url,
        created_at = CURRENT_TIMESTAMP
    `);
    
    query.run({
      $name: location.name,
      $address: location.address,
      $url: location.url
    });
    return true;
  } catch (error) {
    console.error("Error saving location to DB:", error);
    return false;
  }
}

export function getAllLocations(): LocationEntry[] {
  const query = db.query("SELECT name, address, url FROM locations ORDER BY created_at DESC");
  return query.all() as LocationEntry[];
}

export function closeDb() {
  db.close();
}

