import { prisma } from "../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import { stripe } from "../../lib/stripe";
import config from "../../config";
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
  // Authorization: tenant for security deposit/rent, landlord for refunds
  if (data.type === "MOVE_OUT_REFUND") {
    if (request.property.landlordId !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Only the landlord can create refund payments",
      );
    }
  } else {
    if (request.tenantId !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You can only create payments for your own requests",
      );
    }
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
  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;
  if (data.type === "SECURITY_DEPOSIT") {
    amount = Number(request.property.securityDeposit);
  } else if (data.type === "MONTHLY_RENT") {
    amount = Number(request.property.monthlyRent);
    // Auto-calculate period: first day to last day of current month
    const now = new Date();
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    // Check for existing monthly rent payment for this period
    const existingPayment = await prisma.payment.findUnique({
      where: {
        requestId_type_periodStart: {
          requestId: data.requestId,
          type: "MONTHLY_RENT",
          periodStart,
        },
      },
    });
    if (existingPayment) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Monthly rent for this period has already been paid",
      );
    }
  } else if (data.type === "MOVE_OUT_REFUND") {
    const securityDeposit = Number(request.property.securityDeposit);
    const damageAmount = Number(request.damageAmount || 0);
    amount = securityDeposit - damageAmount;
  }
  // Get user email for checkout session
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
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
        ...(data.type === "MONTHLY_RENT" &&
          periodStart && {
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd!.toISOString(),
          }),
      },
      success_url: `${config.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/payment/cancel`,
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
        stripePaymentIntentId: session.id,
        transactionId: session.id,
        periodStart,
        periodEnd,
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
  const { requestId, userId, type, periodStart, periodEnd } =
    session.metadata || {};
  const parsedPeriodStart =
    periodStart && periodStart !== "" ? new Date(periodStart) : null;
  const parsedPeriodEnd =
    periodEnd && periodEnd !== "" ? new Date(periodEnd) : null;

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
      ...(type === "MONTHLY_RENT" &&
        parsedPeriodStart && {
          periodStart: parsedPeriodStart,
          periodEnd: parsedPeriodEnd,
        }),
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

    // Reject other pending move-in requests for this property
    await prisma.request.updateMany({
      where: {
        propertyId: request.propertyId,
        id: { not: requestId },
        status: { in: ["MOVE_IN_REQUESTED", "MOVE_IN_APPROVED"] },
      },
      data: {
        status: "MOVE_IN_REJECTED",
        rejectedReason: "Property is rented",
        rejectedAt: new Date(),
      },
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
