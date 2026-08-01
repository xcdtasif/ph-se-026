import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { TResponseData } from "../types";

export const sendResponse = <T>(res: Response, data: TResponseData<T>) => {
  res.status(data.statusCode).json({
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    data: data.data,
    meta: data.meta,
  });
};

export { StatusCodes };
