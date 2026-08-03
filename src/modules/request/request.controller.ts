import type { Request, Response } from "express";
import type { IAuthRequest } from "../../types";
import {
  createRequest,
  updateRequestStatus,
  getTenantRequests,
  getRequestById,
} from "./request.service";
import { sendResponse } from "../../utils/send-response";
import { StatusCodes } from "http-status-codes";
export const createRequestController = async (
  req: IAuthRequest,
  res: Response,
) => {
  const tenantId = req.user!.id;
  const { propertyId, moveInDate, message } = req.body;

  const request = await createRequest(tenantId, {
    propertyId,
    moveInDate: new Date(moveInDate),
    message,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Request submitted successfully",
    data: request,
  });
};

export const updateRequestStatusController = async (
  req: IAuthRequest,
  res: Response,
) => {
  const userId = req.user!.id;
  const userRole = req.user!.role as "TENANT" | "LANDLORD" | "ADMIN";
  const { id } = req.params;
  const requestId = Array.isArray(id) ? id[0] : id!;
  const { status, rejectedReason, damageAmount, moveOutDate } = req.body;

  const request = await updateRequestStatus(userId, userRole, requestId!, {
    status,
    rejectedReason,
    damageAmount,
    moveOutDate,
  });

  const isApproved =
    status === "MOVE_IN_APPROVED" || status === "MOVE_OUT_APPROVED";
  const isMoveOutRequest = status === "MOVE_OUT_REQUESTED";
  const statusMessage = isMoveOutRequest
    ? "submitted"
    : isApproved
      ? "approved"
      : "rejected";

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `Request ${statusMessage} successfully`,
    data: request,
  });
};

export const getMyRequestsController = async (
  req: IAuthRequest,
  res: Response,
) => {
  const tenantId = req.user!.id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";
  const status = req.query.status as string | undefined;

  const options: Record<string, unknown> = {
    page,
    limit,
    sortBy,
    sortOrder,
  };

  if (status) {
    options.status = status;
  }

  const result = await getTenantRequests(tenantId, options as any);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Requests retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
};

export const getRequestController = async (
  req: IAuthRequest,
  res: Response,
) => {
  const tenantId = req.user!.id;
  const { id } = req.params;
  const requestId = Array.isArray(id) ? id[0] : id!;

  if (!requestId) {
    throw new Error("Request ID is required");
  }

  const request = await getRequestById(requestId, tenantId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Request retrieved successfully",
    data: request,
  });
};
