import config from "../config";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { ITokenPayload } from "../modules/auth/auth.types";

export type { ITokenPayload };

export const generateAccessToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessSecretExpiresIn,
  } as SignOptions);
};

export const generateRefreshToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshSecretExpiresIn,
  } as SignOptions);
};

export const verifyAccessToken = (token: string): ITokenPayload => {
  return jwt.verify(token, config.jwtAccessSecret) as ITokenPayload;
};

export const verifyRefreshToken = (token: string): ITokenPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as ITokenPayload;
};
