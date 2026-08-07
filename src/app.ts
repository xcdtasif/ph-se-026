import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./modules/auth/auth.routes";
import categoryRouter from "./modules/category/category.routes";
import propertyRouter from "./modules/property";
import requestRouter from "./modules/request";
import landlordRouter from "./modules/landlord";
import paymentRouter from "./modules/payment";
import reviewRouter from "./modules/review";
import adminRouter from "./modules/admin";
import { notFoundHandler } from "./middleware/not-found";
import { globalErrorHandler } from "./middleware/global-error";
import { deleteOldRejectedMoveInRequests } from "./modules/request/request.service";
import config from "./config";

const app: Application = express();

// Raw body for Stripe webhook (must be before express.json())
app.use(
  "/api/payments/webhook",
  (req, res, next) => {
    console.error("=== RAW MIDDLEWARE HIT ===");
    console.error("Path:", req.path);
    console.error("Method:", req.method);
    next();
  },
  express.raw({ type: "application/json" }),
);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/api", (req, res) => {
  res.json({
    name: "RentNest API",
    version: "1.0.0",
    description: "Rental Property Marketplace API",
    endpoints: {
      auth: "/api/auth",
      categories: "/api/categories",
      properties: "/api/properties",
      requests: "/api/requests",
      landlord: "/api/landlord",
      payments: "/api/payments",
      reviews: "/api/reviews",
      admin: "/api/admin",
    },
  });
});

app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/properties", propertyRouter);
app.use("/api/requests", requestRouter);
app.use("/api/landlord", landlordRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/admin", adminRouter);

app.get("/api/cron/cleanup-rejected-requests", async (req, res) => {
  const authHeader = req.headers.authorization;
  const cronSecret = config.cronSecret;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const deletedCount = await deleteOldRejectedMoveInRequests();
    return res.json({
      success: true,
      message: `Deleted ${deletedCount} old MOVE_IN_REJECTED requests`,
      deletedCount,
    });
  } catch (error) {
    console.error("[CRON] Error cleaning up rejected requests:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
