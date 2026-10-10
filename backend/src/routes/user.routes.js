import { Router } from "express";
import { registerUser, loginUser, logoutUser, getCurrentUser } from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer..middeleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "photo",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

// router.route("/login").post(loginUser)
router.route("/login").post((req, res, next) => {
    console.log("Login route hit!"); // <--- हे लॉग ऍड करा
    next();
}, loginUser)


//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/current-user").get(verifyJWT, getCurrentUser)




export default router