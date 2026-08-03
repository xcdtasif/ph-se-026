import { Router } from "express";
import {
  createPropertyController,
  updatePropertyController,
  deletePropertyController,
  getMyPropertiesController,
  getMyPropertyController,
  getMyRequestsController,
  updateRequestStatusController,
} from "./landlord.controller";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createPropertySchema,
  updatePropertySchema,
  deletePropertySchema,
  landlordParamsSchema,
  landlordRequestParamsSchema,
  landlordQuerySchema,
} from "./landlord.validation";

const router = Router();

router.use(authenticate, authorize("LANDLORD"));

router.post(
  "/properties",
  validate(createPropertySchema),
  createPropertyController,
);

router.get(
  "/properties",
  validate(landlordQuerySchema),
  getMyPropertiesController,
);

router.get(
  "/properties/:id",
  validate(landlordParamsSchema),
  getMyPropertyController,
);

router.put(
  "/properties/:id",
  validate(updatePropertySchema),
  updatePropertyController,
);

router.delete(
  "/properties/:id",
  validate(deletePropertySchema),
  deletePropertyController,
);

router.get("/requests", getMyRequestsController);

router.patch(
  "/requests/:id",
  validate(landlordRequestParamsSchema),
  updateRequestStatusController,
);

export default router;
