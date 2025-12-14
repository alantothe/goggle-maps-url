import type { Context } from "hono";
import { openFolder } from "./services/filesystem.service";

export async function serveImage(c: Context) {
  const pathname = c.req.path;
  const filePath = "." + pathname;
  const file = Bun.file(filePath);
  const exists = await file.exists();
  if (exists) {
    return new Response(file);
  }
  return c.text("Image Not Found", 404);
}

export async function postOpenFolder(c: Context) {
  try {
    const body = await c.req.json() as { folderPath?: string };
    if (!body.folderPath) return c.json({ error: "Folder path required" }, 400);
    openFolder(body.folderPath);
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error opening folder:", error);
    return c.json({ error: "Failed to open folder" }, 500);
  }
}
