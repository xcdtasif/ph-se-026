import { Router } from "express";
import {
  getAllProperties,
  getPropertyDetails,
  getPropertyReviewsController,
} from "./property.controller";
import { validate } from "../../middleware/validate";
import {
  propertyQuerySchema,
  propertyParamsSchema,
} from "./property.validation";
import { optionalAuth } from "../../middleware/auth";
import { getPropertyReviewsSchema } from "../review/review.validation";

const router = Router();

router.get("/", optionalAuth, validate(propertyQuerySchema), getAllProperties);
router.get(
  "/:id",
  optionalAuth,
  validate(propertyParamsSchema),
  getPropertyDetails,
);
router.get(
  "/:id/reviews",
  optionalAuth,
  validate(getPropertyReviewsSchema),
  getPropertyReviewsController,
);

export default router;
