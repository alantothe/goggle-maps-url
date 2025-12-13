import { Database } from "bun:sqlite";

let db: Database | null = null;

function ensureDb(): Database {
  if (!db) {
    db = new Database("src/data/location.sqlite");
  }
  return db;
}

function addColumn(name: string, ddl: string) {
  const database = ensureDb();
  try {
    database.run(`ALTER TABLE location ADD COLUMN ${ddl}`);
  } catch {
    // Column likely exists; ignore
  }
}

export function initDb() {
  const database = ensureDb();

  database.run(`
    CREATE TABLE IF NOT EXISTS location (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT,
      address TEXT NOT NULL,
      url TEXT NOT NULL,
      embed_code TEXT,
      instagram TEXT,
      images TEXT,
      lat REAL,
      lng REAL,
      original_image_urls TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name, address)
    )
  `);

  // Create location taxonomy table for hierarchical location data
  database.run(`
    CREATE TABLE IF NOT EXISTS location_taxonomy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country TEXT NOT NULL,
      city TEXT,
      neighborhood TEXT,
      location_key TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  addColumn("images", "images TEXT");
  addColumn("lat", "lat REAL");
  addColumn("lng", "lng REAL");
  addColumn("original_image_urls", "original_image_urls TEXT");
  addColumn("instagram", "instagram TEXT");
  addColumn("parent_id", "parent_id INTEGER");
  addColumn("type", "type TEXT DEFAULT 'maps'");
  addColumn("category", "category TEXT DEFAULT 'attractions'");
  addColumn("dining_type", "dining_type TEXT");
  addColumn("title", "title TEXT");
  addColumn("location_key", "location_key TEXT");

  try {
    database.run("UPDATE location SET category = 'attractions' WHERE category IS NULL");
  } catch {
    // Ignore migration errors
  }
}

export function getDb(): Database {
  return ensureDb();
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
