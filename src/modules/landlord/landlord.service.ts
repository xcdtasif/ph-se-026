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
    price: number;
    images?: string[];
    categoryId: string;
  },
) => {
  return prisma.property.create({
    data: {
      ...data,
      landlordId,
      status: "ACTIVE",
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
    price?: number;
    images?: string[];
    categoryId?: string;
    isAvailable?: boolean;
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
  // Check for active rental requests
  const activeRequests = await prisma.rentalRequest.count({
    where: {
      propertyId: id,
      status: { in: ["PENDING", "APPROVED", "COMPLETED"] },
    },
  });
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
  const activeRequests = await prisma.rentalRequest.count({
    where: {
      propertyId: id,
      status: { in: ["PENDING", "APPROVED", "COMPLETED"] },
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
        _count: { select: { rentalRequests: true, reviews: true } },
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

export const getLandlordRentalRequests = async (landlordId: string) => {
  // Get all property IDs owned by this landlord
  const propertyIds = await prisma.property.findMany({
    where: { landlordId },
    select: { id: true },
  });

  const ids = propertyIds.map((p) => p.id);

  return prisma.rentalRequest.findMany({
    where: {
      propertyId: { in: ids },
    },
    include: {
      property: {
        select: { id: true, title: true, location: true, images: true },
      },
      tenant: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateRentalRequestStatus = async (
  requestId: string,
  landlordId: string,
  status: "APPROVED" | "REJECTED",
) => {
  const request = await prisma.rentalRequest.findUnique({
    where: { id: requestId },
    include: { property: true },
  });

  if (!request) {
    throw new ApiError("Rental request not found", 404);
  }

  if (request.property.landlordId !== landlordId) {
    throw new ApiError(
      "You can only manage requests for your own properties",
      403,
    );
  }

  if (request.status !== "PENDING") {
    throw new ApiError(
      `Cannot ${status.toLowerCase()} a ${request.status.toLowerCase()} request`,
      400,
    );
  }

  return prisma.rentalRequest.update({
    where: { id: requestId },
    data: { status },
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
      _count: { select: { rentalRequests: true, reviews: true } },
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
