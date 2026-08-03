import type { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/send-response";
import { StatusCodes } from "http-status-codes";

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  sendResponse(res, {
    success: false,
    statusCode: StatusCodes.NOT_FOUND,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    data: null,
  });
};
