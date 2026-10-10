import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadFilesOnCloudinary } from "../utils/cloudnarry.js"
import { ApiResponce } from "../utils/ApiResponce.js"

const registerUser = asyncHandler(async (req, res) => {

    const { fullName, email, username, password, role } = req.body

    // 1. Validation
    if (
        [fullName, email, username, password, role].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // 2. Check if user exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // 3. Image Upload Handling
    // Multer मधून फाईल पाथ घ्या
    const photoLocalPath = req.files?.photo?.[0]?.path;

    // फोटो नसेल तरी चालेल का? जर कंपल्सरी असेल तर अनकमेंट करा:
    /*
    if (!photoLocalPath) {
        throw new ApiError(400, "Profile Photo is required");
    }
    */

    let profilePhotoUrl = "";
    if (photoLocalPath) {
        const profilePhoto = await uploadFilesOnCloudinary(photoLocalPath)
        if (profilePhoto) {
            profilePhotoUrl = profilePhoto.url
        }
    }

    // 4. Create User
    const user = await User.create({
        fullName,
        profilePhoto: profilePhotoUrl, // Cloudinary URL इथे सेव्ह करा
        email,
        password,
        username: username.toLowerCase(),
        role
    })

    // 5. Fetch Created User (Corrected Syntax Here)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshtoken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponce(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    // --- DEBUG LOGS START ---
    console.log("🔹 Login Attempt:");
    console.log("   Username from Frontend:", username);
    console.log("   Email from Frontend:", email);

    // डेटाबेसमध्ये सर्व युजर्स मोजूया (Count)
    const userCount = await User.countDocuments();
    console.log("   Total Users in DB:", userCount);

    // एक यूजर शोधून बघूया (कोणताही)
    const anyUser = await User.findOne();
    console.log("   First User found in DB:", anyUser);
    // --- DEBUG LOGS END ---

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshtoken = refreshToken
    await user.save({ validateBeforeSave: false })

    const loggedInUser = await User.findById(user._id).select("-password -refreshtoken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponce(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"

            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshtoken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponce(200, {}, "User logged Out"))
})



const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponce(200, req.user, "User fetched successfully"))
})

export { registerUser, loginUser, logoutUser, getCurrentUser }
