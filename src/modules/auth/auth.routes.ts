import { Router } from "express";
import { register, login, refresh, getMe, logout } from "./auth.controller";
import { validate } from "../../middleware/validate";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "./auth.validation";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshTokenSchema), refresh);
router.get("/me", authenticate, getMe);
router.post("/logout", logout);

export default router;
