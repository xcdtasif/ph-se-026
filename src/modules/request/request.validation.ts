import { z } from "zod";

export const createRequestSchema = z.object({
  body: z.object({
    propertyId: z.uuid("Invalid property ID"),
    moveInDate: z.iso.date(),
    message: z.string().optional(),
  }),
});

export const updateRequestSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid request ID"),
  }),
  body: z
    .object({
      status: z.enum([
        "MOVE_IN_APPROVED",
        "MOVE_IN_REJECTED",
        "MOVE_OUT_REQUESTED",
        "MOVE_OUT_APPROVED",
        "MOVE_OUT_REJECTED",
      ]),
      rejectedReason: z.string().optional(),
      damageAmount: z.number().nonnegative().optional(),
      moveOutDate: z.union([z.iso.date(), z.iso.datetime()]).optional(),
    })
    .strict(),
});

export const requestParamsSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid request ID"),
  }),
});

export const requestQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    status: z
      .enum([
        "MOVE_IN_REQUESTED",
        "MOVE_IN_APPROVED",
        "MOVE_IN_REJECTED",
        "MOVED_IN",
        "MOVE_OUT_REQUESTED",
        "MOVE_OUT_APPROVED",
        "MOVE_OUT_REJECTED",
        "MOVED_OUT",
      ])
      .optional(),
  }),
});
