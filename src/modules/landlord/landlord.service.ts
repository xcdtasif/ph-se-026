import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/global-error";
import type {
  IPaginationOptions,
  IPaginationMeta,
  TPaginatedResponse,
} from "../../types";

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
    images?: string[];
    categoryId?: string;
  },
) => {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) {
    throw new ApiError("Property not found", 404);
  }

  if (property.landlordId !== landlordId) {
    throw new ApiError("You can only update your own properties", 403);
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.mapLocation !== undefined) updateData.mapLocation = data.mapLocation;
  if (data.monthlyRent !== undefined) updateData.monthlyRent = data.monthlyRent;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

  // Check for active rental requests
  const activeRequests = await prisma.request.count({
    where: {
      propertyId: id,
      status: { in: ["MOVE_IN_REQUESTED", "MOVE_IN_APPROVED", "MOVED_IN"] },
    },
  });

  if (activeRequests > 0) {
    throw new ApiError(
      "Cannot update property with active rental requests",
      400,
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
    throw new ApiError("Property not found", 404);
  }

  if (property.landlordId !== landlordId) {
    throw new ApiError("You can only delete your own properties", 403);
  }

  // Check for active rental requests
  const activeRequests = await prisma.request.count({
    where: {
      propertyId: id,
      status: { in: ["MOVE_IN_REQUESTED", "MOVE_IN_APPROVED", "MOVED_IN"] },
    },
  });

  if (activeRequests > 0) {
    throw new ApiError(
      "Cannot delete property with active rental requests",
      400,
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
export const updateRequestStatus = async (
  requestId: string,
  landlordId: string,
  status: "MOVE_IN_APPROVED" | "MOVE_IN_REJECTED",
  rejectedReason?: string,
) => {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { property: true },
  });

  if (!request) {
    throw new ApiError("Request not found", 404);
  }

  if (request.property.landlordId !== landlordId) {
    throw new ApiError(
      "You can only manage requests for your own properties",
      403,
    );
  }

  if (request.status !== "MOVE_IN_REQUESTED") {
    throw new ApiError(
      `Cannot ${status.toLowerCase()} a ${request.status.toLowerCase()} request`,
      400,
    );
  }

  const updateData: Record<string, unknown> = {
    status,
    rejectedReason: rejectedReason ?? null,
  };

  if (status === "MOVE_IN_APPROVED") {
    updateData.moveInApprovedAt = new Date();
    await prisma.property.update({
      where: { id: request.propertyId },
      data: { status: "RENTED" },
    });
  } else {
    updateData.rejectedAt = new Date();
  }

  return prisma.request.update({
    where: { id: requestId },
    data: updateData,
    include: {
      property: { select: { id: true, title: true } },
      tenant: { select: { id: true, name: true, email: true } },
    },
  });
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
    throw new ApiError("Property not found", 404);
  }

  if (property.landlordId !== landlordId) {
    throw new ApiError("You can only view your own properties", 403);
  }

  return property;
};
