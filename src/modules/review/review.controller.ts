import type { Request, Response } from "express";
import type { IAuthRequest } from "../../types";
import { createReview, getPropertyReviews } from "./review.service";
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

export const getPropertyReviewsController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const propertyId = Array.isArray(id) ? id[0] : id;
    const { page, limit } = req.query;

    const result = await getPropertyReviews(
      propertyId!,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Property reviews retrieved",
      data: result.data,
      meta: result.meta,
    });
  },
);
