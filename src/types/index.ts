import type { Request } from "express";

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
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
