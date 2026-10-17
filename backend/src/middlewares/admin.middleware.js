import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyAdmin = asyncHandler(async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        throw new ApiError(403, "Access denied. Admin role required.");
    }
});

export const verifyAdminOrManager = asyncHandler(async (req, res, next) => {
    if (req.user && ['admin', 'manager'].includes(req.user.role)) {
        next();
    } else {
        throw new ApiError(403, "Access denied. Admin or manager role required.");
    }
});

export const verifyStaff = asyncHandler(async (req, res, next) => {
    const allowedRoles = ['admin', 'manager', 'cashier', 'chef', 'waiter'];
    if (req.user && allowedRoles.includes(req.user.role)) {
        next();
    } else {
        throw new ApiError(403, "Access denied. Staff member role required.");
    }
});
