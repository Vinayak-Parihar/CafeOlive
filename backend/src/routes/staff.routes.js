import { Router } from "express";
import { addStaff, getAllStaff, removeStaff } from "../controllers/staff.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

// Secure all routes with JWT and Admin check
router.use(verifyJWT);
router.use(verifyAdmin);

router.route("/add").post(addStaff);
router.route("/list").get(getAllStaff);
router.route("/remove/:staffId").delete(removeStaff);

export default router;
