import { Prisma } from "../../../prisma/generated/prisma/client";

export type TPayment = Prisma.PaymentGetPayload<{}>;

export interface ICreatePaymentInput {
  requestId: string;
  amount: number;
  currency: string;
  type: "SECURITY_DEPOSIT" | "MONTHLY_RENT" | "MOVE_OUT_REFUND";
  periodStart?: string;
}

export interface IPaymentFilters {
  page?: number;
  limit?: number;
  status?:
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELED"
    | "REFUNDED";
  type?: "SECURITY_DEPOSIT" | "MONTHLY_RENT" | "MOVE_OUT_REFUND";
}
