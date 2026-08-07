import type { Request, Response } from "express";
import type { IAuthRequest } from "../../types";
import { createReview } from "./review.service";
import { sendResponse } from "../../utils/send-response";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catch-async";

export const createReviewController = catchAsync(
  async (req: IAuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { propertyId, requestId, rating, comment } = req.body;

    const review = await createReview(userId, {
      propertyId,
      requestId,
      rating,
      comment,
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Review created",
      data: review,
    });
  },
);
