import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

import { sanitizeInputs } from "./middlewares/sanitize.middleware.js";
app.use(sanitizeInputs);

//routes
import userRouter from './routes/user.routes.js'
import menuRouter from "./routes/menu.routes.js";
import adminRouter from "./routes/admin.routes.js";
import staffRouter from "./routes/staff.routes.js";
import orderRouter from "./routes/order.routes.js";
import reviewRouter from "./routes/review.routes.js";
import reservationRouter from "./routes/reservation.routes.js";
import inquiryRouter from "./routes/inquiry.routes.js";
import homeRouter from "./routes/home.routes.js";
import tableRouter from "./routes/table.routes.js";

import { ApiError } from "./utils/ApiError.js";
import { errorHandler } from "./middlewares/error.middleware.js";

// Request logger middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Route declarations
app.use("/api/users", userRouter);
app.use("/api/menu", menuRouter);
app.use("/api/admin", adminRouter);
app.use("/api/staff", staffRouter);
app.use("/api/order", orderRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/reservations", reservationRouter);
app.use("/api/inquiries", inquiryRouter);
app.use("/api/home", homeRouter);
app.use("/api/tables", tableRouter);

// Catch-all 404 for unhandled API routes
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

// Centralized error handling middleware
app.use(errorHandler);

export default app; 
