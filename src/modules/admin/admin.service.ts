import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { StatusCodes } from "http-status-codes";

export const getUsers = async (filters: {
  page: number;
  limit: number;
  role?: string;
  isBanned?: boolean;
  search?: string;
}) => {
  const { page = 1, limit = 10, role, isBanned, search } = filters;

  const where: Record<string, unknown> = {};

  if (role) where.role = role;
  if (isBanned !== undefined) where.isBanned = isBanned;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        banReason: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

export const banUnbanUser = async (
  userId: string,
  data: { isBanned: boolean; banReason?: string },
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.role === "ADMIN") {
    throw new AppError(StatusCodes.FORBIDDEN, "Cannot ban admin users");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: data.isBanned,
      banReason: data.isBanned ? (data.banReason ?? null) : null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBanned: true,
      banReason: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

export const getAllProperties = async (filters: {
  page: number;
  limit: number;
  status?: string;
  landlordId?: string;
}) => {
  const { page = 1, limit = 10, status, landlordId } = filters;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (landlordId) where.landlordId = landlordId;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        landlord: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return {
    data: properties,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

export const getAllRequests = async (filters: {
  page: number;
  limit: number;
  status?: string;
}) => {
  const { page = 1, limit = 10, status } = filters;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, title: true, landlordId: true } },
      },
    }),
    prisma.request.count({ where }),
  ]);

  return {
    data: requests,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

export const getAllPayments = async (filters: {
  page: number;
  limit: number;
  status?: string;
  type?: string;
}) => {
  const { page = 1, limit = 10, status, type } = filters;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        request: {
          select: {
            id: true,
            status: true,
            property: { select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    data: payments,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

export const getAdminStats = async () => {
  const [
    totalUsers,
    totalTenants,
    totalLandlords,
    totalProperties,
    availableProperties,
    rentedProperties,
    totalRequests,
    pendingRequests,
    approvedRequests,
    totalPayments,
    totalTransaction,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TENANT" } }),
    prisma.user.count({ where: { role: "LANDLORD" } }),
    prisma.property.count(),
    prisma.property.count({ where: { status: "AVAILABLE" } }),
    prisma.property.count({ where: { status: "RENTED" } }),
    prisma.request.count(),
    prisma.request.count({ where: { status: "MOVE_IN_REQUESTED" } }),
    prisma.request.count({
      where: { status: { in: ["MOVED_IN", "MOVE_OUT_APPROVED"] } },
    }),
    prisma.payment.count(),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      tenants: totalTenants,
      landlords: totalLandlords,
    },
    properties: {
      total: totalProperties,
      available: availableProperties,
      rented: rentedProperties,
    },
    requests: {
      total: totalRequests,
      pending: pendingRequests,
      active: approvedRequests,
    },
    payments: {
      total: totalPayments,
      totalTransaction: Number(totalTransaction._sum.amount ?? 0),
    },
  };
};
