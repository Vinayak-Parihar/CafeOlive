import { sanitizeObject } from "../utils/sanitize.js";

/**
 * Global input sanitization middleware.
 * Sanitizes req.body, req.query, and req.params before routes process them.
 */
export const sanitizeInputs = (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === "object") {
        req.query = sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === "object") {
        req.params = sanitizeObject(req.params);
    }
    next();
};

export default sanitizeInputs;
