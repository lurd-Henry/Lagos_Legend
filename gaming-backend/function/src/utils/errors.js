"use strict";
/**
 * Standard application error class.
 *
 * Provides consistent error codes, messages and optional details
 * throughout the gaming backend.
 */
class AppError extends Error {
    constructor(code, message, details = null) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.details = details;
        Error.captureStackTrace?.(this, AppError);
    }
}
/**
 * Common application error codes.
 */
const ERROR_CODES = Object.freeze({
    UNAUTHENTICATED: "UNAUTHENTICATED",
    PERMISSION_DENIED: "PERMISSION_DENIED",
    INVALID_ARGUMENT: "INVALID_ARGUMENT",
    NOT_FOUND: "NOT_FOUND",
    ALREADY_EXISTS: "ALREADY_EXISTS",
    FAILED_PRECONDITION: "FAILED_PRECONDITION",
    RESOURCE_EXHAUSTED: "RESOURCE_EXHAUSTED",
    UNAVAILABLE: "UNAVAILABLE",
    INTERNAL: "INTERNAL"
});
/**
 * Creates a standard application error.
 *
 * @param {string} code
 * @param {string} message
 * @param {Object|null} details
 * @returns {AppError}
 */
function createError(code, message, details = null) {
    if (!Object.values(ERROR_CODES).includes(code)) {
        throw new TypeError(`Unsupported error code: ${code}`);
    }
    return new AppError(code, message, details);
}
/**
 * Converts an unknown error into a safe application error.
 *
 * Internal error details should not be exposed to players.
 *
 * @param {Error} error
 * @returns {AppError}
 */
function normalizeError(error) {
    if (error instanceof AppError) {
        return error;
    }
    return new AppError(
        ERROR_CODES.INTERNAL,
        "An unexpected server error occurred."
    );
}
/**
 * Creates a safe response object for logging or API handling.
 *
 * Never expose stack traces or sensitive internal information
 * to the client.
 *
 * @param {Error} error
 * @returns {Object}
 */
function formatErrorResponse(error) {
    const appError = normalizeError(error);
    return {
        success: false,
        error: {
            code: appError.code,
            message: appError.message,
            details: appError.details
        }
    };
}
module.exports = {
    AppError,
    ERROR_CODES,
    createError,
    normalizeError,
    formatErrorResponse
};
