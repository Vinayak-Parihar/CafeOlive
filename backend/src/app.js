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
app.use(express.static("public"))

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

//route declaration 
app.use("/api/users", userRouter)
app.use("/api/menu", menuRouter);
app.use("/api/admin", adminRouter);
app.use("/api/staff", staffRouter);
app.use("/api/order", orderRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/reservations", reservationRouter);
app.use("/api/inquiries", inquiryRouter);
app.use("/api/home", homeRouter);

app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});



import { errorHandler } from "./middlewares/error.middleware.js";
app.use(errorHandler);

export default app; 
