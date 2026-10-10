import { Router } from "express";
import { createCategory, addMenuItem, getFullMenu, getAllCategories } from "../controllers/menu.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { upload } from "../middlewares/multer..middeleware.js";

const router = Router();

// कॅटेगरी ऍड करण्यासाठी: POST /api/v1/menu/category
// कॅटेगरी मिळवण्यासाठी: GET /api/v1/menu/category
router.route("/category")
    .post(verifyJWT, verifyAdmin, createCategory)
    .get(getAllCategories);

// मेनू आयटम ऍड करण्यासाठी: POST /api/v1/menu/item
router.route("/item").post(verifyJWT, verifyAdmin, upload.single("image"), addMenuItem);

// वेबसाईटवर मेनू दाखवण्यासाठी: GET /api/v1/menu/list
router.route("/list").get(getFullMenu);

export default router;