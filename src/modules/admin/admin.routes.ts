import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate, authorize } from "../../middleware/auth";
import { catchAsync } from "../../utils/catch-async";
import {
  adminUserQuerySchema,
  adminUserParamsSchema,
  adminBanUserSchema,
  adminPropertyQuerySchema,
  adminRequestQuerySchema,
  adminPaymentQuerySchema,
} from "./admin.validation";
import {
  getUsersController,
  banUnbanUserController,
  getAllPropertiesController,
  getAllRequestsController,
  getAllPaymentsController,
  getAdminStatsController,
} from "./admin.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get(
  "/users",
  validate(adminUserQuerySchema),
  catchAsync(getUsersController),
);
router.patch(
  "/users/:id",
  validate(adminUserParamsSchema),
  validate(adminBanUserSchema),
  catchAsync(banUnbanUserController),
);
router.get("/stats", catchAsync(getAdminStatsController));
router.get(
  "/properties",
  validate(adminPropertyQuerySchema),
  catchAsync(getAllPropertiesController),
);
router.get(
  "/requests",
  validate(adminRequestQuerySchema),
  catchAsync(getAllRequestsController),
);
router.get(
  "/payments",
  validate(adminPaymentQuerySchema),
  catchAsync(getAllPaymentsController),
);

export default router;
