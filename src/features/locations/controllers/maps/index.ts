import type { Context } from "hono";
import type { CreateMapsRequest, UpdateMapsRequest } from "../../models/location";
import { addMapsLocation, updateMapsLocation } from "./services/maps.service";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

export async function postAddMaps(c: Context) {
  try {
    const body = await c.req.json() as CreateMapsRequest;
    if (!body.name || !body.address) {
      return c.json({ error: "Name and address are required" }, 400);
    }
    const entry = await addMapsLocation(body, GOOGLE_MAPS_API_KEY);
    return c.json({ success: true, entry });
  } catch (error: any) {
    console.error(error);
    const message = error?.message || "Server Error";
    const status = message.toLowerCase().includes("required") ? 400 : 500;
    return c.json({ error: message }, status);
  }
}

export async function postUpdateMaps(c: Context) {
  try {
    const body = await c.req.json() as UpdateMapsRequest;
    if (!body.id) {
      return c.json({ error: "Location ID is required" }, 400);
    }
    if (!body.title) {
      return c.json({ error: "Display Title is required" }, 400);
    }
    const entry = await updateMapsLocation(body, GOOGLE_MAPS_API_KEY);
    return c.json({ success: true, entry });
  } catch (error: any) {
    console.error(error);
    const message = error?.message || "Server Error";
    const status = message.toLowerCase().includes("required") ? 400 : 500;
    return c.json({ error: message }, status);
  }
}
