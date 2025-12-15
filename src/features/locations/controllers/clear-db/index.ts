import { Context } from "hono";
import { getDb } from "../../../../shared/db/client";

export async function clearDatabase(c: Context) {
  try {
    const db = getDb();

    // Clear both tables
    db.run("DELETE FROM location");
    db.run("DELETE FROM location_taxonomy");

    // Reset auto-increment counters
    db.run("DELETE FROM sqlite_sequence WHERE name='location'");
    db.run("DELETE FROM sqlite_sequence WHERE name='location_taxonomy'");

    return c.json({
      success: true,
      message: "Database cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing database:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}
