import { join } from "node:path";

export function openFolder(folderPath: string) {
  if (!folderPath) throw new Error("Folder path required");
  const fullPath = join(process.cwd(), folderPath);
  if (!fullPath.startsWith(process.cwd())) {
    throw new Error("Invalid path");
  }
  Bun.spawn(["open", fullPath]);
}
