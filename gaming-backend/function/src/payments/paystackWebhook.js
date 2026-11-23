"use strict";

const {
    validatePaystackEvent
} = require("./paymentValidation");

const {
    createError,
    ERROR_CODES
} = require("../utils/errors");

/**
 * Create Paystack webhook processing service.
 *
 * @param {Object} dependencies
 * @param {Function} dependencies.verifyTransaction
 * @param {Object} dependencies.walletService
 */
function createPaystackWebhookService({
    verifyTransaction,
    walletService
}) {
    if (
        typeof verifyTransaction !== "function" ||
        !walletService ||
        typeof walletService.creditWallet !== "function"
    ) {
        throw new TypeError(
            "Transaction verifier and wallet service are required."
        );
    }

    /**
     * Process a Paystack webhook event.
     *
     * @param {Object} event
     */
    async function processEvent(event) {

        // 1. Validate incoming event.

        const payment = validatePaystackEvent(event);

        // 2. Ignore unrelated events.

        if (!payment) {
            return {
                success: true,
                status: "IGNORED",
                message: "Event does not require processing."
            };
        }

        // 3. Verify transaction directly with Paystack.

        const verifiedTransaction =
            await verifyTransaction(payment.reference);

        if (
            !verifiedTransaction ||
            verifiedTransaction.status !== "success"
        ) {
            throw createError(
                ERROR_CODES.FAILED_PRECONDITION,
                "Payment verification failed."
            );
        }

        // 4. Compare verified transaction with webhook.

        if (
            verifiedTransaction.reference !== payment.reference ||
            verifiedTransaction.amount !== payment.amountKobo ||
            verifiedTransaction.currency !== payment.currency
        ) {
            throw createError(
                ERROR_CODES.FAILED_PRECONDITION,
                "Payment information does not match the verified transaction."
            );
        }

        // 5. Obtain player identity from the server-created order.
        // The wallet service will verify this order again transactionally.
        //
        // This identity must never come from the webhook payload alone.

        if (
            typeof verifiedTransaction.uid !== "string" ||
            !verifiedTransaction.uid
        ) {
            throw createError(
                ERROR_CODES.FAILED_PRECONDITION,
                "Verified payment has no associated player."
            );
        }

        // 6. Credit wallet using Firestore transaction.

        const result = await walletService.creditWallet({
            uid: verifiedTransaction.uid,
            reference: payment.reference,
            amountKobo: payment.amountKobo,
            currency: payment.currency
        });

        return {
            success: true,
            ...result
        };
    }

    return {
        processEvent
    };
}

module.exports = {
    createPaystackWebhookService
};
