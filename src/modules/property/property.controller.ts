import type { Request, Response } from "express";
import { getProperties, getPropertyById } from "./property.service";
import { sendResponse, StatusCodes } from "../../utils/send-response";
import { optionalAuth } from "../../middleware/auth";

export const getAllProperties = async (req: Request, res: Response) => {
  const {
    location,
    minPrice,
    maxPrice,
    categoryId,
    isAvailable,
    page,
    limit,
    sortBy,
    sortOrder,
  } = req.query;

  const filters: Record<string, unknown> = {};

  if (location !== undefined) filters.location = location as string;
  if (minPrice !== undefined) filters.minPrice = Number(minPrice);
  if (maxPrice !== undefined) filters.maxPrice = Number(maxPrice);
  if (categoryId !== undefined) filters.categoryId = categoryId as string;
  if (isAvailable !== undefined) filters.isAvailable = isAvailable === "true";
  if (page !== undefined) filters.page = Number(page);
  else filters.page = 1;
  if (limit !== undefined) filters.limit = Number(limit);
  else filters.limit = 10;
  filters.sortBy = (sortBy as string) || "createdAt";
  filters.sortOrder = (sortOrder as "asc" | "desc") || "desc";

  const result = await getProperties(filters as any);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Properties retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
};

export const getPropertyDetails = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const property = await getPropertyById(id);

  if (!property) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: "Property not found",
      data: null,
    });
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Property retrieved successfully",
    data: property,
  });
};
