import type { Context } from "hono";
import { ServiceContainer } from "../container/service-container";
import { successResponse } from "../../../shared/core/types/api-response";
import type { CreateMapsDto, UpdateMapsDto } from "../validation/schemas/maps.schemas";

const container = ServiceContainer.getInstance();

export async function postAddMaps(c: Context) {
  const dto = c.get("validatedBody") as CreateMapsDto;
  const entry = await container.mapsService.addMapsLocation(dto);
  return c.json(successResponse({ entry }));
}

export async function postUpdateMaps(c: Context) {
  const dto = c.get("validatedBody") as UpdateMapsDto;
  const entry = await container.mapsService.updateMapsLocation(dto);
  return c.json(successResponse({ entry }));
}
