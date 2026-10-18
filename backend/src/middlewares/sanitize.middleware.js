import { sanitizeObject, sanitizeString } from "../utils/sanitize.js";

/**
 * Global input sanitization middleware.
 * Sanitizes req.body, req.query, and req.params safely without breaking Express 5 getters.
 */
export const sanitizeInputs = (req, res, next) => {
    try {
        if (req.body && typeof req.body === "object") {
            req.body = sanitizeObject(req.body);
        }
        if (req.query && typeof req.query === "object") {
            for (const key of Object.keys(req.query)) {
                if (typeof req.query[key] === "string") {
                    req.query[key] = sanitizeString(req.query[key]);
                } else if (typeof req.query[key] === "object" && req.query[key] !== null) {
                    req.query[key] = sanitizeObject(req.query[key]);
                }
            }
        }
        if (req.params && typeof req.params === "object") {
            for (const key of Object.keys(req.params)) {
                if (typeof req.params[key] === "string") {
                    req.params[key] = sanitizeString(req.params[key]);
                }
            }
        }
    } catch (err) {
        console.warn("Input sanitization warning:", err.message);
    }
    next();
};

export default sanitizeInputs;
