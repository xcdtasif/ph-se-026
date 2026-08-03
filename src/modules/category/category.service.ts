import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
export const getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
};

export const createCategory = async (
  name: string,
  createdById: string,
  description?: string,
) => {
  return prisma.category.create({
    data: {
      name,
      description: description ?? null,
      createdById,
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
};

export const getCategoryById = async (id: string) => {
  return prisma.category.findUnique({ where: { id } });
};
