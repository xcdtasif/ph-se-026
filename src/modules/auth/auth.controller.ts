import type { IAuthRequest, IAuthTokens } from "../../types";
import type { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  refreshTokens,
  getCurrentUser,
} from "./auth.service";
import { sendResponse, StatusCodes } from "../../utils/send-response";
import config from "../../config";

const setTokenCookies = (res: Response, tokens: IAuthTokens) => {
  res.cookie("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearTokenCookies = (res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
  });
};

export const register = async (req: Request, res: Response) => {
  const tokens = await registerUser(req.body);
  setTokenCookies(res, tokens);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "User registered successfully",
    data: { accessToken: tokens.accessToken },
  });
};

export const login = async (req: Request, res: Response) => {
  const tokens = await loginUser(req.body);
  setTokenCookies(res, tokens);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Login successful",
    data: { accessToken: tokens.accessToken },
  });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  const tokens = await refreshTokens(refreshToken);
  setTokenCookies(res, tokens);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Tokens refreshed successfully",
    data: { accessToken: tokens.accessToken },
  });
};

export const getMe = async (req: IAuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "User not authenticated",
      data: null,
    });
  }
  const user = await getCurrentUser(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User retrieved successfully",
    data: user,
  });
};

export const logout = async (req: Request, res: Response) => {
  clearTokenCookies(res);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Logged out successfully",
    data: null,
  });
};
