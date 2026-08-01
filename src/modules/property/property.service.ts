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
    isAvailable,
    page,
    limit,
    sortBy,
    sortOrder,
  } = filters;

  const where: Prisma.PropertyWhereInput = { status: "ACTIVE" };

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = minPrice;
    if (maxPrice) where.price.lte = maxPrice;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (isAvailable !== undefined) {
    where.isAvailable = isAvailable;
  }

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

  return {
    data: properties.map((p) => ({
      ...p,
      price: Number(p.price),
    })) as IPropertyWithRelations[],
    meta: {
      page,
      limit,
      total,
      totalPages,
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
    price: Number(property.price),
  };
};
