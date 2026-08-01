import type { Request, Response, NextFunction } from "express";
import { sendResponse, StatusCodes } from "../utils/send-response";

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  sendResponse(res, {
    success: false,
    statusCode: StatusCodes.NOT_FOUND,
    message: `Route ${req.originalUrl} not found`,
    data: null,
  });
};
