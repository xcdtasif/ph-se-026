import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    propertyId: z.uuid(),
    requestId: z.uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
  }),
});

export const getPropertyReviewsSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
});

export type ICreateReviewInput = z.infer<typeof createReviewSchema>["body"];
export type IGetPropertyReviewsQuery = z.infer<
  typeof getPropertyReviewsSchema
>["query"];
