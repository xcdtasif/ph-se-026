import { z } from "zod";

export const adminUserQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    role: z.enum(["TENANT", "LANDLORD", "ADMIN"]).optional(),
    isBanned: z.coerce.boolean().optional(),
    search: z.string().optional(),
  }),
});

export const adminUserParamsSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid user ID"),
  }),
});

export const adminBanUserSchema = z.object({
  body: z.object({
    isBanned: z.boolean(),
    banReason: z.string().max(500).optional(),
  }),
});

export const adminPropertyQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: z.enum(["AVAILABLE", "RENTED", "UNAVAILABLE"]).optional(),
    landlordId: z.uuid().optional(),
  }),
});

export const adminRequestQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
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

export const adminPaymentQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
    type: z
      .enum(["SECURITY_DEPOSIT", "MONTHLY_RENT", "MOVE_OUT_REFUND"])
      .optional(),
  }),
});

export type IAdminUserQuery = z.infer<typeof adminUserQuerySchema>["query"];
export type IAdminBanUserInput = z.infer<typeof adminBanUserSchema>["body"];
export type IAdminPropertyQuery = z.infer<
  typeof adminPropertyQuerySchema
>["query"];
export type IAdminRequestQuery = z.infer<
  typeof adminRequestQuerySchema
>["query"];
export type IAdminPaymentQuery = z.infer<
  typeof adminPaymentQuerySchema
>["query"];
