import { Router } from "express";
import {
    createCategory,
    addMenuItem,
    bulkAddMenuItems,
    getFullMenu,
    getAllCategories,
    getAllMenuItemsAdmin,
    updateMenuItem,
    deleteMenuItem,
    deleteCategory
} from "../controllers/menu.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin, verifyAdminOrManager } from "../middlewares/admin.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Category routes
router.route("/category")
    .post(verifyJWT, verifyAdminOrManager, createCategory)
    .get(getAllCategories);

router.route("/category/:id")
    .delete(verifyJWT, verifyAdminOrManager, deleteCategory);

// Menu Item routes
router.route("/item")
    .post(verifyJWT, verifyAdminOrManager, upload.single("image"), addMenuItem);

router.route("/item/:id")
    .put(verifyJWT, verifyAdminOrManager, upload.single("image"), updateMenuItem)
    .patch(verifyJWT, verifyAdminOrManager, upload.single("image"), updateMenuItem)
    .delete(verifyJWT, verifyAdminOrManager, deleteMenuItem);

// Bulk Add Menu Items: POST /api/menu/bulk
router.route("/bulk")
    .post(verifyJWT, verifyAdminOrManager, bulkAddMenuItems);

// Website menu list (Public): GET /api/menu/list
router.route("/list").get(getFullMenu);

// Admin all menu items (including unavailable): GET /api/menu/admin-list
router.route("/admin-list").get(verifyJWT, verifyAdminOrManager, getAllMenuItemsAdmin);

export default router;