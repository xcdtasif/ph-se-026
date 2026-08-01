import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
} from "./category.controller";
import { validate } from "../../middleware/validate";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
} from "./category.validation";
import { authenticate, authorize, optionalAuth } from "../../middleware/auth";

const router = Router();

// Public routes
router.get("/", optionalAuth, getCategories);
router.get("/:id", optionalAuth, validate(categoryParamsSchema), getCategory);

// Admin only routes
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCategorySchema),
  createCategory,
);
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateCategorySchema),
  updateCategory,
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(categoryParamsSchema),
  deleteCategory,
);

export default router;
