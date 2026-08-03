import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../../lib/prisma";
import type { TPropertyPaginatedResponse } from "./property.types";
import type {
  IPropertyFilters,
  IPropertyWithRelations,
} from "./property.types";

export const getProperties = async (
  filters: IPropertyFilters,
): Promise<TPropertyPaginatedResponse> => {
  const {
    location,
    minPrice,
    maxPrice,
    categoryId,
    status,
    page,
    limit,
    sortBy,
    sortOrder,
  } = filters;

  const where: Prisma.PropertyWhereInput = {};

  if (status) {
    where.status = status;
  } else {
    where.status = "AVAILABLE";
  }

  console.log("getProperties where:", where);

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }

  if (minPrice || maxPrice) {
    where.monthlyRent = {};
    if (minPrice) where.monthlyRent.gte = minPrice;
    if (maxPrice) where.monthlyRent.lte = maxPrice;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  console.log("Final where:", where);

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
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
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.property.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const transformedProperties: IPropertyWithRelations[] = properties.map(
    (p) => ({
      ...p,
      monthlyRent: Number(p.monthlyRent),
      securityDeposit: Number(p.securityDeposit),
    }),
  );

  return {
    data: transformedProperties,
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

export const getPropertyById = async (id: string) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
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
  });

  if (!property) {
    return null;
  }
  return {
    ...property,
    monthlyRent: Number(property.monthlyRent),
    securityDeposit: Number(property.securityDeposit),
  };
};
