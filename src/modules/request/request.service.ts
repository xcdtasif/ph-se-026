import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  IPaginationOptions,
  IPaginationMeta,
  TPaginatedResponse,
} from "../../types";
import { StatusCodes } from "http-status-codes";
import type { RequestStatus } from "../../../prisma/generated/prisma/enums";

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
          "MOVE_OUT_REJECTED",
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
      message: data.message ?? null,
      securityDeposit: property.securityDeposit,
      monthlyRent: property.monthlyRent,
      status: "MOVE_IN_REQUESTED",
    },
    include: {
      property: {
        include: {
          category: true,
          landlord: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
    },
  });
};

export const updateRequestStatus = async (
  userId: string,
  userRole: "TENANT" | "LANDLORD" | "ADMIN",
  requestId: string,
  data: {
    status:
      | "MOVE_IN_APPROVED"
      | "MOVE_IN_REJECTED"
      | "MOVE_OUT_REQUESTED"
      | "MOVE_OUT_APPROVED"
      | "MOVE_OUT_REJECTED";
    rejectedReason?: string;
    damageAmount?: number;
    moveOutDate?: string | Date;
  },
) => {
  const { status, rejectedReason, damageAmount, moveOutDate } = data;

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
  // Validate transitions
  const validTransitions: Record<
    "TENANT" | "LANDLORD" | "ADMIN",
    Record<RequestStatus, RequestStatus[]>
  > = {
    TENANT: {
      MOVE_IN_REQUESTED: ["MOVE_OUT_REQUESTED"],
      MOVE_IN_APPROVED: ["MOVE_OUT_REQUESTED"],
      MOVED_IN: ["MOVE_OUT_REQUESTED"],
      MOVE_IN_REJECTED: [],
      MOVE_OUT_REQUESTED: [],
      MOVE_OUT_APPROVED: [],
      MOVE_OUT_REJECTED: ["MOVE_OUT_REQUESTED"],
      MOVED_OUT: [],
    },
    LANDLORD: {
      MOVE_IN_REQUESTED: ["MOVE_IN_APPROVED", "MOVE_IN_REJECTED"],
      MOVE_IN_APPROVED: [],
      MOVE_IN_REJECTED: [],
      MOVED_IN: [],
      MOVE_OUT_REQUESTED: ["MOVE_OUT_APPROVED", "MOVE_OUT_REJECTED"],
      MOVE_OUT_APPROVED: [],
      MOVE_OUT_REJECTED: [],
      MOVED_OUT: [],
    },
    ADMIN: {
      MOVE_IN_REQUESTED: ["MOVE_IN_APPROVED", "MOVE_IN_REJECTED"],
      MOVE_IN_APPROVED: ["MOVE_IN_REJECTED"],
      MOVE_IN_REJECTED: [],
      MOVED_IN: [],
      MOVE_OUT_REQUESTED: ["MOVE_OUT_APPROVED", "MOVE_OUT_REJECTED"],
      MOVE_OUT_APPROVED: [],
      MOVE_OUT_REJECTED: [],
      MOVED_OUT: [],
    },
  };

  const allowed =
    validTransitions[userRole]?.[request.status]?.includes(status);
  if (!allowed) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Invalid status transition from ${request.status} to ${status} for ${userRole}`,
    );
  }

  // Validate fields per transition
  if (userRole === "TENANT") {
    // Tenant can only request move-out, no damageAmount or rejectedReason
    if (status === "MOVE_OUT_REQUESTED") {
      if (damageAmount !== undefined) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Tenants cannot specify damage amount",
        );
      }
      if (rejectedReason !== undefined) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Tenants cannot provide rejection reason",
        );
      }
    }
  }

  if (userRole === "LANDLORD") {
    // Landlord approving/rejecting move-in
    if (request.status === "MOVE_IN_REQUESTED") {
      if (status === "MOVE_IN_REJECTED" && !rejectedReason) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Rejection reason is required when rejecting move-in request",
        );
      }
      if (damageAmount !== undefined) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Landlords cannot specify damage amount for move-in decision",
        );
      }
      if (moveOutDate !== undefined) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Landlords cannot specify move-out date for move-in decision",
        );
      }
    }
    // Landlord approving/rejecting move-out
    if (request.status === "MOVE_OUT_REQUESTED") {
      if (status === "MOVE_OUT_REJECTED" && !rejectedReason) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Rejection reason is required when rejecting move-out request",
        );
      }
      if (status === "MOVE_OUT_APPROVED") {
        if (damageAmount !== undefined && damageAmount < 0) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Damage amount cannot be negative",
          );
        }
        if (moveOutDate !== undefined) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Landlords cannot specify move-out date for move-out approval",
          );
        }
      }
    }
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
    // Use provided moveOutDate or calculate default (10th of next month)
    const moveOutDateValue = data.moveOutDate
      ? new Date(data.moveOutDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 10);
    return prisma.request.update({
      where: { id: requestId },
      data: {
        status,
        moveOutDate: moveOutDateValue,
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
    if (damageAmount !== undefined) {
      updateData.damageAmount = damageAmount;
    }
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
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
              },
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
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
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
