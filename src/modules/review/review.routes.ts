import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { catchAsync } from "../../utils/catch-async";
import { createReviewSchema } from "./review.validation";
import { createReviewController } from "./review.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createReviewSchema),
  catchAsync(createReviewController),
);

export default router;
