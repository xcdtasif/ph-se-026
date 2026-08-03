import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catch-async";
import { sendResponse } from "../utils/send-response";
import { StatusCodes } from "http-status-codes";
import type { IAuthRequest } from "../types";

export const authenticate = catchAsync(
  async (req: IAuthRequest, res: Response, next: NextFunction) => {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return sendResponse(res, {
        success: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: "Access token not provided",
        data: null,
      });
    }

    try {
      const decoded = jwt.verify(accessToken, config.jwtAccessSecret) as {
        id: string;
        email: string;
        role: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, isBanned: true },
      });

      if (!user || user.isBanned) {
        return sendResponse(res, {
          success: false,
          statusCode: StatusCodes.UNAUTHORIZED,
          message: "User not found or banned",
          data: null,
        });
      }

      req.user = { id: user.id, email: user.email, role: user.role };
      next();
    } catch {
      return sendResponse(res, {
        success: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: "Invalid or expired access token",
        data: null,
      });
    }
  },
);

export const authorize = (...roles: string[]) => {
  return catchAsync(
    async (req: IAuthRequest, res: Response, next: NextFunction) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return sendResponse(res, {
          success: false,
          statusCode: StatusCodes.FORBIDDEN,
          message: "Forbidden: insufficient permissions",
          data: null,
        });
      }
      next();
    },
  );
};

export const optionalAuth = catchAsync(
  async (req: IAuthRequest, res: Response, next: NextFunction) => {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return next();
    }

    try {
      const decoded = jwt.verify(accessToken, config.jwtAccessSecret) as {
        id: string;
        email: string;
        role: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, isBanned: true },
      });

      if (user && !user.isBanned) {
        req.user = { id: user.id, email: user.email, role: user.role };
      }
    } catch {
      // ignore invalid token for optional auth
    }

    next();
  },
);
