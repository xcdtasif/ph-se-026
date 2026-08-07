import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
export const getAllCategories = async (options?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const skip = (page - 1) * limit;
  const where = options?.search
    ? {
        name: {
          contains: options.search,
          mode: "insensitive" as const,
        },
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.category.count({ where }),
  ]);

  return {
    data,
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

export const createCategory = async (name: string, description?: string) => {
  return prisma.category.create({
    data: {
      name,
      description: description ?? null,
    },
  });
};

export const updateCategory = async (
  id: string,
  name?: string,
  description?: string,
) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }
  const data: { name?: string; description?: string | null } = {};

  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description ?? null;

  return prisma.category.update({
    where: { id },
    data,
  });
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }

  // Check if category has properties
  const propertiesCount = await prisma.property.count({
    where: { categoryId: id },
  });
  if (propertiesCount > 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot delete category with associated properties",
    );
  }

  await prisma.category.delete({ where: { id } });
};

export const getCategoryById = async (id: string) => {
  return prisma.category.findUnique({ where: { id } });
};
