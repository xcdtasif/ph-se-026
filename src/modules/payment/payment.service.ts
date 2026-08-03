import { prisma } from "../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import { stripe } from "../../lib/stripe";
import type { ICreatePaymentInput } from "./payment.types";
import type {
  PaymentStatus,
  PaymentType,
} from "../../../prisma/generated/prisma/enums";
import { Prisma } from "../../../prisma/generated/prisma/client";
import { AppError } from "../../utils/app-error";
import type Stripe from "stripe";

export const createPayment = async (
  userId: string,
  data: ICreatePaymentInput,
) => {
  const request = await prisma.request.findUnique({
    where: { id: data.requestId },
    include: { property: true },
  });

  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, "Request not found");
  }

  if (request.tenantId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only create payments for your own requests",
    );
  }

  // Validate request status for payment type
  if (
    data.type === "SECURITY_DEPOSIT" &&
    request.status !== "MOVE_IN_APPROVED"
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Security deposit can only be paid after move-in is approved",
    );
  }

  if (
    data.type === "MONTHLY_RENT" &&
    !["MOVED_IN", "MOVE_OUT_REQUESTED", "MOVE_OUT_APPROVED"].includes(
      request.status,
    )
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Monthly rent can only be paid for active rentals",
    );
  }

  if (
    data.type === "MOVE_OUT_REFUND" &&
    request.status !== "MOVE_OUT_APPROVED"
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Move-out refund can only be processed after move-out is approved",
    );
  }

  // Auto-determine amount based on payment type and property
  let amount = data.amount;
  if (data.type === "SECURITY_DEPOSIT") {
    amount = Number(request.property.securityDeposit);
  } else if (data.type === "MONTHLY_RENT") {
    amount = Number(request.property.monthlyRent);
  }

  // Get user email for checkout session
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Create Stripe Checkout Session
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: (data.currency || "bdt").toLowerCase(),
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `${data.type.replace("_", " ")} - ${request.property.title}`,
              metadata: {
                requestId: data.requestId,
                propertyId: request.propertyId,
              },
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        requestId: data.requestId,
        userId,
        type: data.type,
        ...(data.periodStart && { periodStart: data.periodStart }),
      },
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    });

    // Create payment record with session ID
    const payment = await prisma.payment.create({
      data: {
        requestId: data.requestId,
        userId,
        amount: new Prisma.Decimal(amount),
        currency: (data.currency || "bdt").toUpperCase(),
        type: data.type,
        status: "PENDING",
        provider: "STRIPE",
        stripePaymentIntentId: session.id, // Store session ID here for lookup
        transactionId: session.id,
        periodStart: data.periodStart ? new Date(data.periodStart) : null,
      },
    });

    return {
      payment,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  } catch (stripeError: any) {
    console.error(
      "Stripe error:",
      stripeError.message,
      stripeError.code,
      stripeError.type,
    );
    throw new AppError(
      StatusCodes.BAD_GATEWAY,
      `Stripe error: ${stripeError.message}`,
    );
  }
};

export const handleWebhook = async (payload: Buffer, signature: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Webhook signature verification failed",
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleSuccessfulCheckout(session);
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    throw err;
  }

  return { received: true };
};

const handleSuccessfulCheckout = async (session: Stripe.Checkout.Session) => {
  const { requestId, userId, type, periodStart } = session.metadata || {};
  const parsedPeriodStart =
    periodStart && periodStart !== "" ? new Date(periodStart) : null;

  if (!requestId || !userId || !type) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Missing required metadata in checkout session",
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: session.id },
  });

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment record not found");
  }

  const request = await prisma.request.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, "Request not found");
  }

  // Mark payment as completed
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      periodStart: parsedPeriodStart ?? null,
    },
  });

  if (type === "SECURITY_DEPOSIT") {
    await prisma.request.update({
      where: { id: requestId },
      data: { status: "MOVED_IN" },
    });

    await prisma.property.update({
      where: { id: request.propertyId },
      data: { status: "RENTED" },
    });
  } else if (type === "MONTHLY_RENT") {
    // Monthly rent payment recorded, no status change
  } else if (type === "MOVE_OUT_REFUND") {
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "MOVED_OUT",
        completedAt: new Date(),
      },
    });

    await prisma.property.update({
      where: { id: request.propertyId },
      data: { status: "AVAILABLE" },
    });
  }
};

const handleFailedPayment = async (paymentIntent: Stripe.PaymentIntent) => {
  await prisma.payment.update({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: "FAILED" },
  });
};

export const getPayments = async (
  userId: string,
  filters: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    id?: string;
  },
) => {
  const { page = 1, limit = 10, status, type, id } = filters;

  const where: Prisma.PaymentWhereInput = {
    userId,
    ...(status && { status: status as PaymentStatus }),
    ...(type && { type: type as PaymentType }),
    ...(id && { id }),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        request: {
          select: {
            id: true,
            status: true,
            property: {
              select: { id: true, title: true },
            },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    data: payments,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

export const getPaymentById = async (userId: string, paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      request: {
        select: {
          id: true,
          status: true,
          tenantId: true,
          property: {
            select: { id: true, title: true },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  if (payment.request.tenantId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only view your own payments",
    );
  }

  return payment;
};
