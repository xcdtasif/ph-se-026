import type { Request, Response } from "express";
import type { IAuthRequest } from "../../types";
import {
  createProperty,
  updateProperty,
  deleteProperty,
  getLandlordProperties,
  getLandlordRequests,
  updateRequestStatus,
  getLandlordPropertyById,
} from "./landlord.service";
import { AppError } from "../../utils/app-error";
import { sendResponse } from "../../utils/send-response";
import { StatusCodes } from "http-status-codes";

export const createPropertyController = async (
  req: IAuthRequest,
  res: Response,
) => {
  const landlordId = req.user!.id;
  const property = await createProperty(landlordId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Property created successfully",
    data: property,
  });
};

export const updatePropertyController = async (
  req: IAuthRequest,
  res: Response,
) => {
  const landlordId = req.user!.id;
  const id = req.params.id as string;

  const property = await updateProperty(id, landlordId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Property updated successfully",
    data: property,
  });
};

export const deletePropertyController = async (
  req: IAuthRequest,
  res: Response,
) => {
  const landlordId = req.user!.id;
  const id = req.params.id as string;

  await deleteProperty(id, landlordId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Property deleted successfully",
    data: null,
  });
};

export const getMyPropertiesController = async (
  req: IAuthRequest,
  res: Response,
) => {
  const landlordId = req.user!.id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

  const result = await getLandlordProperties(landlordId, {
    page,
    limit,
    sortBy,
    sortOrder,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Properties retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
};

export const getMyPropertyController = async (
  req: IAuthRequest,
  res: Response,
) => {
  const landlordId = req.user!.id;
  const id = req.params.id as string;

  const property = await getLandlordPropertyById(id, landlordId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Property retrieved successfully",
    data: property,
  });
};

export const getMyRequestsController = async (
  req: IAuthRequest,
  res: Response,
) => {
  const landlordId = req.user!.id;
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
  if (status !== undefined) options.status = status;

  const result = await getLandlordRequests(landlordId, options as any);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Requests retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
};

export const updateRequestStatusController = async (
  req: IAuthRequest,
  res: Response,
) => {
  const landlordId = req.user!.id;
  const id = req.params.id as string;
  const { status, rejectedReason } = req.body;

  if (!["MOVE_IN_APPROVED", "MOVE_IN_REJECTED"].includes(status)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid status. Must be MOVE_IN_APPROVED or MOVE_IN_REJECTED",
    );
  }

  const request = await updateRequestStatus(
    id,
    landlordId,
    status,
    rejectedReason,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `Request ${status.toLowerCase()} successfully`,
    data: request,
  });
};
