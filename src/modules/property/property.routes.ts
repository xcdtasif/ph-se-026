import { Router } from "express";
import { getAllProperties, getPropertyDetails } from "./property.controller";
import { validate } from "../../middleware/validate";
import {
  propertyQuerySchema,
  propertyParamsSchema,
} from "./property.validation";
import { optionalAuth } from "../../middleware/auth";

const router = Router();

router.get("/", optionalAuth, validate(propertyQuerySchema), getAllProperties);
router.get(
  "/:id",
  optionalAuth,
  validate(propertyParamsSchema),
  getPropertyDetails,
);

export default router;
