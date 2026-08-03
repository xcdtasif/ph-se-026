import type { Request, Response } from "express";
import type { IAuthRequest } from "../../types";
import {
  createPayment,
  handleWebhook,
  getPayments,
  getPaymentById,
} from "./payment.service";
import { sendResponse } from "../../utils/send-response";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catch-async";

export const createPaymentIntentController = catchAsync(
  async (req: IAuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { requestId, amount, currency, type, periodStart } = req.body;

    const result = await createPayment(userId, {
      requestId,
      amount,
      currency,
      type,
      periodStart,
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Checkout session created",
      data: {
        paymentId: result.payment.id,
        checkoutUrl: result.checkoutUrl,
        sessionId: result.sessionId,
      },
    });
  },
);

export const stripeWebhookController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers["stripe-signature"] as string;
    const payload = req.body;

    await handleWebhook(payload, signature);

    res.json({ received: true });
  },
);

export const getMyPaymentsController = catchAsync(
  async (req: IAuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { page, limit, status, type, id } = req.query;

    const result = await getPayments(userId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      status: status as string,
      type: type as string,
      id: id as string,
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Payments retrieved",
      data: result.data,
      meta: result.meta,
    });
  },
);

export const getPaymentController = catchAsync(
  async (req: IAuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const paymentId = Array.isArray(id) ? id[0] : id;

    const payment = await getPaymentById(userId, paymentId!);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Payment retrieved",
      data: payment,
    });
  },
);
