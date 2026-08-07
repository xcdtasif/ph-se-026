import type { Request, Response } from "express";
import type { IAuthRequest } from "../../types";
import {
  createProperty,
  updateProperty,
  deleteProperty,
  getLandlordProperties,
  getLandlordRequests,
  getLandlordPropertyById,
} from "./landlord.service";
import { sendResponse } from "../../utils/send-response";
import { StatusCodes } from "http-status-codes";

export const createPropertyController = async (
  req: IAuthRequest,
  res: Response,
) => {
  const landlordId = req.user!.id;
  const data = req.body;

  const property = await createProperty(landlordId, data);

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
  const data = req.body;

  const property = await updateProperty(id, landlordId, data);

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
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
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
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string | undefined;
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

  const result = await getLandlordRequests(landlordId, {
    page,
    limit,
    sortBy,
    sortOrder,
    ...(status ? { status } : {}),
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Requests retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
};
