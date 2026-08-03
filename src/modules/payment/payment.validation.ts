import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  body: z.object({
    requestId: z.uuid("Invalid request ID"),
    amount: z.number().positive("Amount must be positive").optional(),
    currency: z
      .string()
      .length(3, "Currency must be 3 characters")
      .default("bdt"),
    type: z.enum(["SECURITY_DEPOSIT", "MONTHLY_RENT", "MOVE_OUT_REFUND"]),
    periodStart: z.iso.date().optional(),
  }),
});

export const webhookSchema = z.object({
  body: z.any(), // Raw body for signature verification
});

export const paymentQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    status: z
      .enum([
        "PENDING",
        "PROCESSING",
        "SUCCEEDED",
        "FAILED",
        "CANCELED",
        "REFUNDED",
      ])
      .optional(),
    type: z
      .enum(["SECURITY_DEPOSIT", "MONTHLY_RENT", "MOVE_OUT_REFUND"])
      .optional(),
    id: z.uuid("Invalid payment ID").optional(),
  }),
});

export const paymentParamsSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid payment ID"),
  }),
});
