import type { Context } from "hono";
import { addInstagramEmbed } from "./services/instagram.service";

export async function postAddInstagram(c: Context) {
  try {
    const body = await c.req.json() as { embedCode: string; locationId: number };
    const entry = await addInstagramEmbed({ embedCode: body.embedCode, locationId: body.locationId });
    return c.json({ success: true, entry });
  } catch (error: any) {
    console.error(error);
    const message = error?.message || "Server Error";
    const status = message.toLowerCase().includes("required") ? 400 : 500;
    return c.json({ error: message }, status);
  }
}
