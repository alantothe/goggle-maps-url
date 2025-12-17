import type { Context } from "hono";
import { ServiceContainer } from "../container/service-container";
import { successResponse } from "../../../shared/core/types/api-response";
import type { AddInstagramDto } from "../validation/schemas/instagram.schemas";

const container = ServiceContainer.getInstance();

export async function postAddInstagram(c: Context) {
  const dto = c.get("validatedBody") as AddInstagramDto;
  const entry = await container.instagramService.addInstagramEmbed(dto);
  return c.json(successResponse({ entry }));
}
