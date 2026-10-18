/**
 * Utility functions for user input sanitization and XSS prevention
 */

export const sanitizeString = (str) => {
    if (typeof str !== "string") return str;
    return str
        .replace(/[<>]/g, "") // Strip raw HTML tags to prevent XSS
        .trim();
};

export const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        // Prevent prototype pollution
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
            continue;
        }

        if (typeof value === "string") {
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === "object" && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};
