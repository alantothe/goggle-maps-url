import { z } from "zod";

export const locationCategorySchema = z.enum([
  "dining",
  "accommodations",
  "attractions",
  "nightlife"
]);

export const createMapsSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  address: z.string().trim().min(1, "Address is required"),
  category: locationCategorySchema
});

export const updateMapsSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1, "Title is required"),
  address: z.string().trim().min(1).optional(),
  category: locationCategorySchema.optional(),
  contactAddress: z.string().trim().optional(),
  countryCode: z.string().length(2).optional(),
  phoneNumber: z.string().trim().optional(),
  website: z.string().url().optional(),
  locationKey: z.string().trim().optional().nullable()
});

export type CreateMapsDto = z.infer<typeof createMapsSchema>;
export type UpdateMapsDto = z.infer<typeof updateMapsSchema>;
