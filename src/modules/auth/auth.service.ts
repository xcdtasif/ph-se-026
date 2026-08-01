import { prisma } from "../../lib/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  type ITokenPayload,
  verifyRefreshToken,
} from "../../utils/jwt";
import { ApiError } from "../../middleware/global-error";
import type { IAuthTokens, IRegisterInput, ILoginInput } from "./auth.types";

export const registerUser = async (
  input: IRegisterInput,
): Promise<IAuthTokens> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new ApiError("User with this email already exists", 409);
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
    throw new ApiError("Invalid email or password", 401);
  }

  if (user.isBanned) {
    throw new ApiError("Account is banned", 403);
  }

  const isPasswordValid = await comparePassword(
    input.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new ApiError("Invalid email or password", 401);
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
    throw new ApiError("Invalid or expired refresh token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, isBanned: true },
  });

  if (!user || user.isBanned) {
    throw new ApiError("User not found or banned", 401);
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
    throw new ApiError("User not found", 404);
  }

  return user;
};
