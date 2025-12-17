import { z } from "zod";

export const addInstagramSchema = z.object({
  embedCode: z.string().min(1, "Embed code is required"),
  locationId: z.number().int().positive("Valid location ID required")
});

export type AddInstagramDto = z.infer<typeof addInstagramSchema>;
