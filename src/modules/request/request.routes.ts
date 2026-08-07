import { Router } from "express";
import {
  createRequestController,
  updateRequestStatusController,
  getMyRequestsController,
  getRequestController,
} from "./request.controller";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createRequestSchema,
  updateRequestSchema,
  requestParamsSchema,
  requestQuerySchema,
} from "./request.validation";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("TENANT"),
  validate(createRequestSchema),
  createRequestController,
);
router.get(
  "/",
  authorize("TENANT"),
  validate(requestQuerySchema),
  getMyRequestsController,
);
router.get(
  "/:id",
  authorize("TENANT"),
  validate(requestParamsSchema),
  getRequestController,
);
router.patch(
  "/:id",
  authenticate,
  validate(updateRequestSchema),
  updateRequestStatusController,
);

export default router;
