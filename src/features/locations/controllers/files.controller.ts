import type { Context } from "hono";
import { join } from "node:path";
import { BadRequestError } from "../../../shared/core/errors/http-error";

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
  const body = await c.req.json() as { folderPath?: string };

  if (!body.folderPath) {
    throw new BadRequestError("Folder path required");
  }

  const fullPath = join(process.cwd(), body.folderPath);
  if (!fullPath.startsWith(process.cwd())) {
    throw new BadRequestError("Invalid path");
  }

  Bun.spawn(["open", fullPath]);
  return c.json({ success: true });
}
