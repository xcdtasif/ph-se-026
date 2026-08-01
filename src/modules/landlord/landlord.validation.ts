import { z } from "zod";

export const createPropertySchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    location: z.string().min(2, "Location is required"),
    mapLocation: z.url("Invalid map location URL").optional(),
    price: z.number().positive("Price must be positive"),
    images: z.array(z.url("Invalid image URL")).optional().default([]),
    categoryId: z.uuid("Invalid category ID"),
  }),
});

export const updatePropertySchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    location: z.string().min(2).optional(),
    mapLocation: z.url().optional(),
    price: z.number().positive().optional(),
    images: z.array(z.url()).optional(),
    categoryId: z.uuid().optional(),
    isAvailable: z.boolean().optional(),
  }),
  params: z.object({
    id: z.uuid("Invalid property ID"),
  }),
});

export const deletePropertySchema = z.object({
  params: z.object({
    id: z.uuid("Invalid property ID"),
  }),
});

export const landlordQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    sortBy: z.enum(["price", "createdAt"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const landlordParamsSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid property ID"),
  }),
});
