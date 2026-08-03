import { z } from "zod";

export const propertyQuerySchema = z.object({
  query: z.object({
    location: z.string().optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    categoryId: z.uuid().optional(),
    status: z.enum(["AVAILABLE", "RENTED", "UNAVAILABLE"]).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    sortBy: z
      .enum(["monthlyRent", "createdAt"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const propertyParamsSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid property ID"),
  }),
});
