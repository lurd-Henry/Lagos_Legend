"use strict";

const crypto = require("node:crypto");

const {
    createError,
    ERROR_CODES
} = require("../utils/errors");

/**
 * Verify Paystack webhook signature.
 *
 * IMPORTANT:
 * rawBody must be the original, unmodified HTTP request body.
 *
 * @param {Buffer} rawBody
 * @param {string} signature
 * @param {string} secret
 * @returns {boolean}
 */
function verifyPaystackSignature(rawBody, signature, secret) {
    if (
        !Buffer.isBuffer(rawBody) ||
        typeof signature !== "string" ||
        typeof secret !== "string" ||
        !secret
    ) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac("sha512", secret)
        .update(rawBody)
        .digest("hex");

    const received = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
        received.length !== expected.length ||
        received.length === 0
    ) {
        return false;
    }

    return crypto.timingSafeEqual(received, expected);
}

/**
 * Validate Paystack event structure.
 *
 * @param {Object} event
 * @returns {Object|null}
 */
function validatePaystackEvent(event) {
    if (!event || typeof event !== "object") {
        throw createError(
            ERROR_CODES.INVALID_ARGUMENT,
            "Invalid payment event."
        );
    }

    // Ignore unrelated Paystack events.
    if (event.event !== "charge.success") {
        return null;
    }

    const data = event.data;

    if (!data || typeof data !== "object") {
        throw createError(
            ERROR_CODES.INVALID_ARGUMENT,
            "Payment event data is missing."
        );
    }

    const {
        reference,
        amount,
        currency,
        status
    } = data;

    if (
        typeof reference !== "string" ||
        !/^[A-Za-z0-9._-]{1,100}$/.test(reference)
    ) {
        throw createError(
            ERROR_CODES.INVALID_ARGUMENT,
            "Invalid payment reference."
        );
    }

    if (
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {
        throw createError(
            ERROR_CODES.INVALID_ARGUMENT,
            "Invalid payment amount."
        );
    }

    if (currency !== "NGN") {
        throw createError(
            ERROR_CODES.INVALID_ARGUMENT,
            "Unsupported payment currency."
        );
    }

    if (status !== "success") {
        throw createError(
            ERROR_CODES.FAILED_PRECONDITION,
            "Payment was not successful."
        );
    }

    return {
        reference,
        amountKobo: amount,
        currency,
        status
    };
}

module.exports = {
    verifyPaystackSignature,
    validatePaystackEvent
};
