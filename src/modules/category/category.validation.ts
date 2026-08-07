import { z } from "zod";

export const getCategoriesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
  params: z.object({
    id: z.uuid("Invalid category ID"),
  }),
});

export const categoryParamsSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid category ID"),
  }),
});
