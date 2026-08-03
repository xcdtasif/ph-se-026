import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { sendResponse, StatusCodes } from "../utils/send-response";
import { Prisma } from "../../prisma/generated/prisma/client";

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ZodError) {
    const messages = err.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: messages,
      data: null,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[])?.join(", ") || "field";
      return sendResponse(res, {
        success: false,
        statusCode: StatusCodes.CONFLICT,
        message: `Unique constraint violation on ${target}`,
        data: null,
      });
    }
  }

  if (err instanceof ApiError) {
    return sendResponse(res, {
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      data: null,
    });
  }

  console.error("Error:", err);
  console.error("Stack:", err.stack);

  return sendResponse(res, {
    success: false,
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message: "Internal server error",
    data: null,
  });
};
