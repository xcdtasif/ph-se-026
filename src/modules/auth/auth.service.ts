import { prisma } from "../../lib/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  type ITokenPayload,
  verifyRefreshToken,
} from "../../utils/jwt";
import { AppError } from "../../utils/app-error";
import type { IAuthTokens, IRegisterInput, ILoginInput } from "./auth.types";
import { StatusCodes } from "http-status-codes";

export const registerUser = async (
  input: IRegisterInput,
): Promise<IAuthTokens> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "User with this email already exists",
    );
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone ?? null,
      role: input.role as "TENANT" | "LANDLORD" | "ADMIN",
    },
  });

  const payload: ITokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { accessToken, refreshToken };
};

export const loginUser = async (input: ILoginInput): Promise<IAuthTokens> => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  if (user.isBanned) {
    throw new AppError(StatusCodes.FORBIDDEN, "Account is banned");
  }

  const isPasswordValid = await comparePassword(
    input.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const payload: ITokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { accessToken, refreshToken };
};

export const refreshTokens = async (
  refreshToken: string,
): Promise<IAuthTokens> => {
  let payload: ITokenPayload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, isBanned: true },
  });

  if (!user || user.isBanned) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not found or banned");
  }

  const newPayload: ITokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  return { accessToken, refreshToken: newRefreshToken };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatar: true,
      role: true,
      isBanned: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};
