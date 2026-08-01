import { z } from "zod";

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
