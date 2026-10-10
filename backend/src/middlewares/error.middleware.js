import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    // Check if the error is an instance of ApiError
    if (!(error instanceof ApiError)) {
        // Create a new ApiError for unhandled errors
        const statusCode = error.statusCode || 500;
        const message = error.message || "Internal Server Error";
        error = new ApiError(statusCode, message, [], error.stack);
    }

    const response = {
        statusCode: error.statusCode,
        success: false,
        message: error.message,
        errors: error.errors || [],
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
    };

    // Remove empty errors array if not needed or keep for consistency
    // based on ApiError structure, it has errors array.

    return res.status(error.statusCode).json(response);
};

export { errorHandler };
