import { Router } from "express";
import {
	getDashboardStats,
	getPendingOrders,
	getHomeMedia,
	uploadHomeMedia,
	addGalleryMedia,
	removeHomeMedia,
	getSiteSettings,
	updateSiteSettings,
	restoreDefaultMedia
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin, verifyAdminOrManager } from "../middlewares/admin.middleware.js";
import { imageUpload } from "../middlewares/multer..middeleware.js";

const router = Router();

// Apply auth and admin check to all routes
router.use(verifyJWT);
// router.use(verifyAdmin); // If verifyAdmin is a separate middleware. Based on user.routes.js context, role check might be needed. 
// Re-checking menu.routes.js: it imports verifyAdmin.

router.route("/stats").get(verifyAdmin, getDashboardStats);
router.route("/pending-orders").get(verifyAdmin, getPendingOrders);
router.route("/home-media").get(verifyAdminOrManager, getHomeMedia);
router.route("/home-media").post(verifyAdminOrManager, imageUpload.single("image"), addGalleryMedia);
router.route("/home-media/restore-defaults").post(verifyAdminOrManager, restoreDefaultMedia);
router.route("/home-media/:imageKey").post(verifyAdminOrManager, imageUpload.single("image"), uploadHomeMedia);
router.route("/home-media/:imageKey").delete(verifyAdminOrManager, removeHomeMedia);
router.route("/settings").get(verifyAdminOrManager, getSiteSettings).put(verifyAdminOrManager, updateSiteSettings);

export default router;
