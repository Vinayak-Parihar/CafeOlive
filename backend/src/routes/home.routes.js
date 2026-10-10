import { Router } from "express";
import { getHomeMedia, getSiteSettings } from "../controllers/admin.controller.js";

const router = Router();

router.get("/media", getHomeMedia);
router.get("/settings", getSiteSettings);

export default router;