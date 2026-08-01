import config from "../config";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { ITokenPayload } from "../types";

export type { ITokenPayload };

export const generateAccessToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
};

export const generateRefreshToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
};

export const verifyAccessToken = (token: string): ITokenPayload => {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as ITokenPayload;
};

export const verifyRefreshToken = (token: string): ITokenPayload => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as ITokenPayload;
};
