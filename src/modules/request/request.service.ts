import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  IPaginationOptions,
  IPaginationMeta,
  TPaginatedResponse,
} from "../../types";
import { StatusCodes } from "http-status-codes";

export const createRequest = async (
  tenantId: string,
  data: {
    propertyId: string;
    moveInDate: Date;
    message?: string;
  },
) => {
  const property = await prisma.property.findUnique({
    where: { id: data.propertyId },
  });

  if (!property) {
    throw new AppError(StatusCodes.NOT_FOUND, "Property not found");
  }

  if (property.status !== "AVAILABLE") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Property is not available");
  }

  // Check if tenant already has a pending/approved/active request for this property
  const existingRequest = await prisma.request.findFirst({
    where: {
      tenantId,
      propertyId: data.propertyId,
      status: {
        in: [
          "MOVE_IN_REQUESTED",
          "MOVE_IN_APPROVED",
          "MOVED_IN",
          "MOVE_OUT_REQUESTED",
          "MOVE_OUT_APPROVED",
        ],
      },
    },
  });

  if (existingRequest) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You already have an active request for this property",
    );
  }

  return prisma.request.create({
    data: {
      tenantId,
      propertyId: data.propertyId,
      moveInDate: data.moveInDate,
      message: data.message,
      securityDeposit: property.securityDeposit,
      monthlyRent: property.monthlyRent,
      status: "MOVE_IN_REQUESTED",
    },
    include: {
      property: {
        include: {
          category: true,
          landlord: {
            select: { id: true, name: true, email: true, phone: true, avatar: true },
          },
        },
      },
      tenant: {
        select: { id: true, name: true, email: true, phone: true, avatar: true },
      },
    },
  });
};

export const updateRequestStatus = async (
  userId: string,
  userRole: "TENANT" | "LANDLORD" | "ADMIN",
  requestId: string,
  data: {
    status: "MOVE_IN_APPROVED" | "MOVE_IN_REJECTED" | "MOVE_OUT_REQUESTED" | "MOVE_OUT_APPROVED" | "MOVE_OUT_REJECTED";
    rejectedReason?: string;
  },
) => {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { property: true },
  });

  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, "Request not found");
  }

  // Authorization
  if (userRole === "TENANT" && request.tenantId !== userId) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not your request");
  }
  if (userRole === "LANDLORD" && request.property.landlordId !== userId) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not your property");
  }

  const { status, rejectedReason } = data;

  // Validate transitions
  const validTransitions: Record<string, string[]> = {
    TENANT: {
      MOVE_IN_REQUESTED: ["MOVE_OUT_REQUESTED"],
      MOVE_IN_APPROVED: ["MOVE_OUT_REQUESTED"],
      MOVED_IN: ["MOVE_OUT_REQUESTED"],
      MOVE_OUT_REJECTED: ["MOVE_OUT_REQUESTED"],
    },
    LANDLORD: {
      MOVE_IN_REQUESTED: ["MOVE_IN_APPROVED", "MOVE_IN_REJECTED"],
      MOVE_OUT_REQUESTED: ["MOVE_OUT_APPROVED", "MOVE_OUT_REJECTED"],
    },
    ADMIN: {
      MOVE_IN_REQUESTED: ["MOVE_IN_APPROVED", "MOVE_IN_REJECTED"],
      MOVE_IN_APPROVED: ["MOVE_IN_REJECTED"],
      MOVE_OUT_REQUESTED: ["MOVE_OUT_APPROVED", "MOVE_OUT_REJECTED"],
    },
  };

  const allowed = validTransitions[userRole]?.[request.status]?.includes(status);
  if (!allowed) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Invalid status transition from ${request.status} to ${status} for ${userRole}`,
    );
  }

  // Move-out window validation (1st-10th of month)
  if (status === "MOVE_OUT_REQUESTED") {
    const now = new Date();
    const day = now.getDate();
    if (day < 1 || day > 10) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Move-out can only be requested between 1st and 10th of the month",
      );
    }
    // Calculate move-out date (11th of next month or end of current month)
    const moveOutDate = new Date(now.getFullYear(), now.getMonth() + 1, 10);
    return prisma.request.update({
      where: { id: requestId },
      data: {
        status,
        moveOutDate,
        moveOutRequestedAt: now,
      },
      include: { property: true, tenant: true },
    });
  }

  const updateData: Record<string, unknown> = { status };
  if (rejectedReason) {
    updateData.rejectedReason = rejectedReason;
    updateData.rejectedAt = new Date();
  }
  if (status === "MOVE_IN_APPROVED") {
    updateData.moveInApprovedAt = new Date();
  }
  if (status === "MOVE_OUT_APPROVED") {
    updateData.moveOutApprovedAt = new Date();
  }

  return prisma.request.update({
    where: { id: requestId },
    data: updateData,
    include: { property: true, tenant: true },
  });
};

export const getTenantRequests = async (
  tenantId: string,
  options: IPaginationOptions & { status?: string },
): Promise<TPaginatedResponse<unknown>> => {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { tenantId };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.request.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          include: {
            category: true,
            landlord: {
              select: { id: true, name: true, email: true, phone: true, avatar: true },
            },
          },
        },
      },
    }),
    prisma.request.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const getRequestById = async (id: string, tenantId: string) => {
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          category: true,
          landlord: {
            select: { id: true, name: true, email: true, phone: true, avatar: true },
          },
        },
      },
      tenant: {
        select: { id: true, name: true, email: true, phone: true, avatar: true },
      },
      payments: true,
      review: true,
    },
  });

  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, "Request not found");
  }

  if (request.tenantId !== tenantId) {
    throw new AppError(StatusCodes.FORBIDDEN, "Not your request");
  }

  return request;
};

// Internal functions for payment webhook automation
export const markRequestAsMovedIn = async (requestId: string) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.request.update({
      where: { id: requestId },
      data: { status: "MOVED_IN", movedInAt: new Date() },
    });

    await tx.property.update({
      where: { id: request.propertyId },
      data: { status: "RENTED" },
    });

    return request;
  });
};

export const markRequestAsMovedOut = async (requestId: string) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.request.update({
      where: { id: requestId },
      data: { status: "MOVED_OUT", completedAt: new Date() },
    });

    await tx.property.update({
      where: { id: request.propertyId },
      data: { status: "AVAILABLE" },
    });

    return request;
  });
};

// Cleanup: Delete MOVE_IN_REJECTED requests older than 7 days
export const deleteOldRejectedMoveInRequests = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await prisma.request.deleteMany({
    where: {
      status: "MOVE_IN_REJECTED",
      rejectedAt: { lt: sevenDaysAgo },
    },
  });

  return result.count;
};