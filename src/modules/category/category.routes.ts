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
  getCategoriesQuerySchema,
} from "./category.validation";
import { authenticate, authorize, optionalAuth } from "../../middleware/auth";

const router = Router();

router.get(
  "/",
  optionalAuth,
  validate(getCategoriesQuerySchema),
  getCategories,
);
router.get("/:id", optionalAuth, validate(categoryParamsSchema), getCategory);
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
