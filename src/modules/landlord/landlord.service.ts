import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  IPaginationOptions,
  IPaginationMeta,
  TPaginatedResponse,
} from "../../types";
import { StatusCodes } from "http-status-codes";

export const createProperty = async (
  landlordId: string,
  data: {
    title: string;
    description: string;
    location: string;
    mapLocation?: string;
    monthlyRent: number;
    securityDeposit: number;
    images?: string[];
    categoryId: string;
  },
) => {
  return prisma.property.create({
    data: {
      ...data,
      landlordId,
      status: "AVAILABLE",
    },
  });
};

export const updateProperty = async (
  id: string,
  landlordId: string,
  data: {
    title?: string;
    description?: string;
    location?: string;
    mapLocation?: string;
    monthlyRent?: number;
    securityDeposit?: number;
    images?: string[];
    categoryId?: string;
    status?: "AVAILABLE" | "RENTED" | "UNAVAILABLE";
  },
) => {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) {
    throw new AppError(StatusCodes.NOT_FOUND, "Property not found");
  }

  if (property.landlordId !== landlordId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only update your own properties",
    );
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.monthlyRent !== undefined) updateData.monthlyRent = data.monthlyRent;
  if (data.securityDeposit !== undefined)
    updateData.securityDeposit = data.securityDeposit;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.status !== undefined) updateData.status = data.status;

  // Check for active rental requests
  const activeRequests = await prisma.request.count({
    where: {
      propertyId: id,
      status: { in: ["MOVE_IN_REQUESTED", "MOVE_IN_APPROVED", "MOVED_IN"] },
    },
  });

  if (activeRequests > 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot update property with active rental requests",
    );
  }

  return prisma.property.update({
    where: { id },
    data: updateData,
  });
};

export const deleteProperty = async (id: string, landlordId: string) => {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) {
    throw new AppError(StatusCodes.NOT_FOUND, "Property not found");
  }

  if (property.landlordId !== landlordId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only delete your own properties",
    );
  }

  // Check for active rental requests
  const activeRequests = await prisma.request.count({
    where: {
      propertyId: id,
      status: { in: ["MOVE_IN_REQUESTED", "MOVE_IN_APPROVED", "MOVED_IN"] },
    },
  });

  if (activeRequests > 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot delete property with active rental requests",
    );
  }

  return prisma.property.delete({ where: { id } });
};
export const getLandlordProperties = async (
  landlordId: string,
  options: IPaginationOptions,
): Promise<TPaginatedResponse<unknown>> => {
  const { page, limit, sortBy, sortOrder } = options;
  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where: { landlordId },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { requests: true, reviews: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.property.count({ where: { landlordId } }),
  ]);

  const meta: IPaginationMeta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  };

  return { data: properties, meta };
};

export const getLandlordRequests = async (
  landlordId: string,
  options: IPaginationOptions & { status?: string },
): Promise<TPaginatedResponse<unknown>> => {
  const { page, limit, sortBy, sortOrder, status } = options;
  const skip = (page - 1) * limit;

  // Get all property IDs owned by this landlord
  const propertyIds = await prisma.property.findMany({
    where: { landlordId },
    select: { id: true },
  });

  const ids = propertyIds.map((p) => p.id);

  const where: Record<string, unknown> = {
    propertyId: { in: ids },
  };
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      include: {
        property: {
          select: { id: true, title: true, location: true, images: true },
        },
        tenant: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.request.count({ where }),
  ]);

  const meta: IPaginationMeta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  };

  return { data: requests, meta };
};

export const getLandlordPropertyById = async (
  id: string,
  landlordId: string,
) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      category: true,
      landlord: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { requests: true, reviews: true } },
    },
  });

  if (!property) {
    throw new AppError(StatusCodes.NOT_FOUND, "Property not found");
  }

  if (property.landlordId !== landlordId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only view your own properties",
    );
  }

  return property;
};
