import type { Request } from "express";

export interface ITokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IRegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type TPaginatedResponse<T> = {
  data: T[];
  meta: IPaginationMeta;
};

export type TResponseData<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: IPaginationMeta;
};

export interface IAuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}
