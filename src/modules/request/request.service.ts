import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/global-error";
import type {
  IPaginationOptions,
  IPaginationMeta,
  TPaginatedResponse,
} from "../../types";

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
    throw new ApiError("Property not found", 404);
  }

  if (property.status !== "AVAILABLE") {
    throw new ApiError("Property is not available for rent", 400);
  }

  // Check if tenant already has a pending/approved/active request for this property
  const existingRequest = await prisma.request.findFirst({
    where: {
      propertyId: data.propertyId,
      tenantId,
      status: {
        in: ["MOVE_IN_REQUESTED", "MOVE_IN_APPROVED", "MOVED_IN"],
      },
    },
  });

  if (existingRequest) {
    throw new ApiError(
      "You already have a pending or approved request for this property",
      400,
    );
  }

  return prisma.request.create({
    data: {
      tenantId,
      propertyId: data.propertyId,
      status: "MOVE_IN_REQUESTED",
      moveInDate: data.moveInDate,
      monthlyRent: Number(property.monthlyRent),
      securityDeposit: Number(property.securityDeposit),
      message: data.message ?? null,
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          images: true,
          monthlyRent: true,
          securityDeposit: true,
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
    moveOutDate?: Date;
  },
) => {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { property: true },
  });

  if (!request) {
    throw new ApiError("Request not found", 404);
  }

  const isMoveIn =
    data.status === "MOVE_IN_APPROVED" || data.status === "MOVE_IN_REJECTED";
  const isMoveOut =
    data.status === "MOVE_OUT_REQUESTED" ||
    data.status === "MOVE_OUT_APPROVED" ||
    data.status === "MOVE_OUT_REJECTED";
  const isMoveInApproval = data.status === "MOVE_IN_APPROVED";
  const isMoveOutApproval = data.status === "MOVE_OUT_APPROVED";
  const isTenantMoveOutRequest =
    userRole === "TENANT" && data.status === "MOVE_OUT_REQUESTED";

  // Authorization checks - landlord actions must own the property
  if (isMoveIn || (isMoveOut && !isTenantMoveOutRequest)) {
    if (request.property.landlordId !== userId) {
      throw new ApiError(
        "You can only manage requests for your own properties",
        403,
      );
    }
  }

  // Prevent tenants from approving/rejecting
  if (
    userRole === "TENANT" &&
    (isMoveIn || (isMoveOut && !isTenantMoveOutRequest))
  ) {
    throw new ApiError("Tenants cannot approve or reject requests", 403);
  }

  // Prevent landlords from requesting move-out
  if (userRole === "LANDLORD" && data.status === "MOVE_OUT_REQUESTED") {
    throw new ApiError("Landlords cannot request move-out", 403);
  }

  if (isTenantMoveOutRequest) {
    // State transition validation for MOVE_IN approval/rejection
    if (isMoveIn && request.status !== "MOVE_IN_REQUESTED") {
      throw new ApiError(
        "Request is not in a state to be approved/rejected",
        400,
      );
    }

    // State transition validation for MOVE_OUT request
    if (
      !["MOVE_IN_APPROVED", "MOVED_IN", "MOVE_OUT_REJECTED"].includes(
        request.status,
      )
    ) {
      throw new ApiError(
        "Can only request move-out for approved or active rentals, or after move-out rejection",
        400,
      );
    }

    // Validate 10th of month rule - request 1st-10th, move out 11th-end of current month
    const now = new Date();
    const requestedMoveOut = new Date(data.moveOutDate!);

    // Request must be submitted 1st-10th
    if (now.getDate() > 10) {
      throw new ApiError(
        "Move-out requests must be submitted between 1st and 10th of the month",
        400,
      );
    }

    // Move-out date must be 11th or later of current month
    const earliestMoveOut = new Date(now);
    earliestMoveOut.setDate(11);
    earliestMoveOut.setHours(0, 0, 0, 0);

    const lastDayCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    );
    lastDayCurrentMonth.setHours(23, 59, 59, 999);

    if (
      requestedMoveOut < earliestMoveOut ||
      requestedMoveOut > lastDayCurrentMonth
    ) {
      throw new ApiError(
        `Move-out date must be between 11th and ${lastDayCurrentMonth.getDate()}th of current month`,
        400,
      );
    }
  }

  if (
    isMoveOut &&
    !isTenantMoveOutRequest &&
    request.status !== "MOVE_OUT_REQUESTED"
  ) {
    throw new ApiError("Request is not in move-out requested state", 400);
  }

  const updateData: Record<string, unknown> = {
    status: data.status,
    rejectedReason: data.rejectedReason ?? null,
  };

  if (data.status === "MOVE_IN_APPROVED") {
    updateData.moveInApprovedAt = new Date();
    await prisma.property.update({
      where: { id: request.propertyId },
      data: { status: "UNAVAILABLE" },
    });
  } else if (data.status === "MOVE_IN_REJECTED") {
    updateData.rejectedAt = new Date();
  } else if (data.status === "MOVE_OUT_REQUESTED") {
    updateData.moveOutDate = new Date(data.moveOutDate!);
    await prisma.property.update({
      where: { id: request.propertyId },
      data: { status: "RENTED" },
    });
  } else if (data.status === "MOVE_OUT_APPROVED") {
    const finalMoveOutDate = data.moveOutDate ?? request.moveOutDate;
    if (!finalMoveOutDate) {
      throw new ApiError("Move-out date is required", 400);
    }

    const damageAmount = data.damageAmount ?? 0;
    const refundAmount = Number(request.securityDeposit) - damageAmount;

    if (refundAmount < 0) {
      throw new ApiError("Damage amount cannot exceed security deposit", 400);
    }

    updateData.moveOutDate = new Date(finalMoveOutDate);
    updateData.damageAmount = damageAmount;
    updateData.moveOutApprovedAt = new Date();
    // Property stays RENTED until actual move out
  } else if (data.status === "MOVE_OUT_REJECTED") {
    updateData.rejectedAt = new Date();
  }

  return prisma.request.update({
    where: { id: requestId },
    data: updateData,
    include: {
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          images: true,
          monthlyRent: true,
          securityDeposit: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
};

export const getTenantRequests = async (
  tenantId: string,
  options: IPaginationOptions & { status?: string },
): Promise<TPaginatedResponse<unknown>> => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    status,
  } = options;

  const where: Record<string, unknown> = {
    tenantId,
  };

  if (status) {
    where.status = status;
  }

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            images: true,
            monthlyRent: true,
            securityDeposit: true,
            status: true,
          },
        },
      },
    }),
    prisma.request.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: requests,
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
  return prisma.request.findFirst({
    where: { id, tenantId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          mapLocation: true,
          images: true,
          monthlyRent: true,
          securityDeposit: true,
          status: true,
        },
      },
    },
  });
};

// Internal functions for payment webhook automation
export const markRequestAsMovedIn = async (requestId: string) => {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { property: true },
  });

  if (!request) {
    throw new ApiError("Request not found", 404);
  }

  if (request.status !== "MOVE_IN_APPROVED") {
    throw new ApiError("Request must be in MOVE_IN_APPROVED status", 400);
  }

  await prisma.$transaction([
    prisma.request.update({
      where: { id: requestId },
      data: {
        status: "MOVED_IN",
        completedAt: new Date(),
      },
    }),
    prisma.property.update({
      where: { id: request.propertyId },
      data: { status: "RENTED" },
    }),
  ]);

  return request;
};

export const markRequestAsMovedOut = async (requestId: string) => {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { property: true },
  });

  if (!request) {
    throw new ApiError("Request not found", 404);
  }

  if (request.status !== "MOVE_OUT_APPROVED") {
    throw new ApiError("Request must be in MOVE_OUT_APPROVED status", 400);
  }

  await prisma.$transaction([
    prisma.request.update({
      where: { id: requestId },
      data: {
        status: "MOVED_OUT",
        completedAt: new Date(),
      },
    }),
    prisma.property.update({
      where: { id: request.propertyId },
      data: { status: "AVAILABLE" },
    }),
  ]);

  return request;
};
