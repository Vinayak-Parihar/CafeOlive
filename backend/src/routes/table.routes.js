import { Router } from "express";
import {
    getAllTables,
    createOrUpdateTable,
    getTableScanInfo,
    registerCustomerSession,
    resetTableSession,
    deleteTable
} from "../controllers/table.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyStaff } from "../middlewares/admin.middleware.js";

const router = Router();

// ── Customer & Scanning Endpoints (Public) ───────────────────────────────────
router.route("/scan-info").get(getTableScanInfo);
router.route("/scan-info/:tableNumber").get(getTableScanInfo);
router.route("/register-session").post(registerCustomerSession);

// ── Staff & Admin Protected Endpoints (Admin, Manager, Kitchen/Chef, Waiter, Cashier)
router.use(verifyJWT);
router.use(verifyStaff);

router.route("/")
    .get(getAllTables)
    .post(createOrUpdateTable);

router.route("/:identifier/reset")
    .post(resetTableSession);

router.route("/:id")
    .delete(deleteTable);

export default router;
