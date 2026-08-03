import { Router } from "express";
import {
  createPaymentIntentController,
  stripeWebhookController,
  getMyPaymentsController,
  getPaymentController,
} from "./payment.controller";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createPaymentIntentSchema,
  webhookSchema,
  paymentQuerySchema,
  paymentParamsSchema,
} from "./payment.validation";

const router = Router();

// Webhook needs raw body - will be handled in app.ts
router.post("/webhook", stripeWebhookController);

router.use(authenticate);

router.post(
  "/",
  validate(createPaymentIntentSchema),
  createPaymentIntentController,
);
router.get("/", validate(paymentQuerySchema), getMyPaymentsController);
router.get("/:id", validate(paymentParamsSchema), getPaymentController);

export default router;
