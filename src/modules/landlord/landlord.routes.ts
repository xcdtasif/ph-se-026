import { Router } from "express";
import {
  createPropertyController,
  updatePropertyController,
  deletePropertyController,
  getMyPropertiesController,
  getMyPropertyController,
  getMyRentalRequestsController,
  updateRentalRequestStatusController,
} from "./landlord.controller";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createPropertySchema,
  updatePropertySchema,
  deletePropertySchema,
  landlordParamsSchema,
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

router.get("/requests", getMyRentalRequestsController);

router.patch(
  "/requests/:id",
  validate(landlordParamsSchema),
  updateRentalRequestStatusController,
);

export default router;
