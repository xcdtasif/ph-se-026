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

app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/properties", propertyRouter);
app.use("/api/requests", requestRouter);
app.use("/api/landlord", landlordRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
