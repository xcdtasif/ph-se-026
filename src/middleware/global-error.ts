import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { sendResponse, StatusCodes } from "../utils/send-response";
import { Prisma } from "../../prisma/generated/prisma/client";
import { AppError } from "../utils/app-error";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import config from "../config";

// Re-export for backward compatibility

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Zod validation errors
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

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = (err.meta?.target as string[])?.join(", ") || "field";
        return sendResponse(res, {
          success: false,
          statusCode: StatusCodes.CONFLICT,
          message: `Duplicate value for: ${target}`,
          data: null,
        });
      }
      case "P2025": {
        return sendResponse(res, {
          success: false,
          statusCode: StatusCodes.NOT_FOUND,
          message: "Requested record not found",
          data: null,
        });
      }
      case "P2003": {
        return sendResponse(res, {
          success: false,
          statusCode: StatusCodes.BAD_REQUEST,
          message: "Related record does not exist",
          data: null,
        });
      }
      default: {
        return sendResponse(res, {
          success: false,
          statusCode: StatusCodes.BAD_REQUEST,
          message: "Database request error",
          data: config.nodeEnv !== "production" ? { code: err.code } : null,
        });
      }
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: "Invalid data provided to database query",
      data: null,
    });
  }

  // Stripe errors
  if (err instanceof Stripe.errors.StripeError) {
    const statusCode = err.statusCode || StatusCodes.BAD_GATEWAY;
    return sendResponse(res, {
      success: false,
      statusCode,
      message: err.message || "Payment processing error",
      data:
        config.nodeEnv !== "production"
          ? { type: err.type, code: err.code }
          : null,
    });
  }

  // JWT errors
  if (err instanceof jwt.TokenExpiredError) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "Token expired",
      data: null,
    });
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "Invalid token",
      data: null,
    });
  }

  // Custom AppError
  if (err instanceof AppError) {
    return sendResponse(res, {
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      data: err.errorDetails ?? null,
    });
  }

  // Unknown errors
  console.error("Error:", err);
  console.error("Stack:", err.stack);

  const message =
    config.nodeEnv === "production" ? "Internal server error" : err.message;

  const data =
    config.nodeEnv !== "production" && err instanceof Error
      ? { stack: err.stack }
      : null;

  return sendResponse(res, {
    success: false,
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message,
    data,
  });
};
