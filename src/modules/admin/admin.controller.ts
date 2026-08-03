import type { Request, Response } from "express";
import type { IAuthRequest } from "../../types";
import {
  getUsers,
  banUnbanUser,
  getAllProperties,
  getAllRequests,
  getAllPayments,
  getAdminStats,
} from "./admin.service";
import { sendResponse } from "../../utils/send-response";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catch-async";

export const getUsersController = catchAsync(
  async (req: IAuthRequest, res: Response) => {
    const { page, limit, role, isBanned, search } = req.query;

    const result = await getUsers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      ...(role && { role: role as string }),
      ...(isBanned !== undefined && { isBanned: isBanned === "true" }),
      ...(search && { search: search as string }),
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Users retrieved",
      data: result.data,
      meta: result.meta,
    });
  },
);

export const banUnbanUserController = catchAsync(
  async (req: IAuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;
    const { isBanned, banReason } = req.body;

    const user = await banUnbanUser(userId!, { isBanned, banReason });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: isBanned ? "User banned" : "User unbanned",
      data: user,
    });
  },
);

export const getAllPropertiesController = catchAsync(
  async (req: IAuthRequest, res: Response) => {
    const { page, limit, status, landlordId } = req.query;

    const result = await getAllProperties({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      ...(status && { status: status as string }),
      ...(landlordId && { landlordId: landlordId as string }),
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "All properties retrieved",
      data: result.data,
      meta: result.meta,
    });
  },
);

export const getAllRequestsController = catchAsync(
  async (req: IAuthRequest, res: Response) => {
    const { page, limit, status } = req.query;

    const result = await getAllRequests({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      ...(status && { status: status as string }),
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "All requests retrieved",
      data: result.data,
      meta: result.meta,
    });
  },
);

export const getAllPaymentsController = catchAsync(
  async (req: IAuthRequest, res: Response) => {
    const { page, limit, status, type } = req.query;

    const result = await getAllPayments({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      ...(status && { status: status as string }),
      ...(type && { type: type as string }),
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "All payments retrieved",
      data: result.data,
      meta: result.meta,
    });
  },
);

export const getAdminStatsController = catchAsync(
  async (req: IAuthRequest, res: Response) => {
    const stats = await getAdminStats();

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Admin stats retrieved",
      data: stats,
    });
  },
);
