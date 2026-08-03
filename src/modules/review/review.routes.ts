import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { catchAsync } from "../../utils/catch-async";
import {
  createReviewSchema,
  getPropertyReviewsSchema,
} from "./review.validation";
import {
  createReviewController,
  getPropertyReviewsController,
} from "./review.controller";

const router = Router();

// Create review (tenant only, after MOVED_OUT)
router.post(
  "/",
  authenticate,
  validate(createReviewSchema),
  catchAsync(createReviewController),
);

// Get property reviews (public)
router.get(
  "/properties/:id/reviews",
  validate(getPropertyReviewsSchema),
  catchAsync(getPropertyReviewsController),
);

export default router;
