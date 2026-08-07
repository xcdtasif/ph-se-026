import type { Request, Response } from "express";
import type { IAuthRequest } from "../../types";
import {
  getAllCategories,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService,
  getCategoryById,
} from "./category.service";
import { sendResponse } from "../../utils/send-response";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../utils/app-error";

export const getCategories = async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
  } = req.query as {
    page?: string;
    limit?: string;
    search?: string;
  };

  const categories = await getAllCategories({
    page: Number(page),
    limit: Number(limit),
    ...(search ? { search } : {}),
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Categories retrieved successfully",
    data: categories,
  });
};

export const createCategory = async (req: IAuthRequest, res: Response) => {
  const { name, description } = req.body;

  const category = await createCategoryService(name, description);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Category created successfully",
    data: category,
  });
};

export const updateCategory = async (req: IAuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { name, description } = req.body;

  const category = await updateCategoryService(id, name, description);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Category updated successfully",
    data: category,
  });
};

export const deleteCategory = async (req: IAuthRequest, res: Response) => {
  const id = req.params.id as string;

  await deleteCategoryService(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Category deleted successfully",
    data: null,
  });
};

export const getCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const category = await getCategoryById(id);

  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Category retrieved successfully",
    data: category,
  });
};
