import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponce } from "../utils/ApiResponce.js"

// 1. Add New Staff (Admin Only)
const addStaff = asyncHandler(async (req, res) => {
    const { fullName, email, username, password, role } = req.body

    // Basic Validation
    if ([fullName, email, username, password, role].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Role Validation (Must be chef or waiter for this portal, though admin can theoretically add anyone)
    if (!['chef', 'waiter', 'manager'].includes(role)) {
        throw new ApiError(400, "Invalid role. Must be 'chef', 'waiter', or 'manager'.");
    }

    // Check Existence
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // Create User
    const user = await User.create({
        fullName,
        email,
        password,
        username: username.toLowerCase(),
        role
    })

    const createdUser = await User.findById(user._id).select("-password -refreshtoken")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the staff member")
    }

    return res.status(201).json(
        new ApiResponce(201, createdUser, `${role} added successfully`)
    )
})

// 2. Get All Staff
const getAllStaff = asyncHandler(async (req, res) => {
    // Fetch users where role is one of the staff roles
    const staff = await User.find({
        role: { $in: ['chef', 'waiter', 'manager', 'admin'] }
    }).select("-password -refreshtoken");

    return res.status(200).json(
        new ApiResponce(200, staff, "Staff fetched successfully")
    )
})

// 3. Remove Staff
const removeStaff = asyncHandler(async (req, res) => {
    const { staffId } = req.params;

    const user = await User.findById(staffId);

    if (!user) {
        throw new ApiError(404, "Staff member not found");
    }

    // Prevent deleting self (though verifying admin middleware handles auth, logic check is good)
    if (user._id.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot delete your own account.");
    }

    await User.findByIdAndDelete(staffId);

    return res.status(200).json(
        new ApiResponce(200, {}, "Staff member removed successfully")
    )
})

export { addStaff, getAllStaff, removeStaff }
