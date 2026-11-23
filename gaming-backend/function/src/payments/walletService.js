"use strict";

const {

    createError,

    ERROR_CODES

} = require("../utils/errors");

/**

 * Create a wallet credit service.

 *

 * Dependencies will be supplied when Firebase is configured.

 *

 * @param {Object} dependencies

 * @param {Object} dependencies.db

 * @param {Object} dependencies.FieldValue

 */

function createWalletService({ db, FieldValue }) {

    if (!db || !FieldValue) {

        throw new TypeError(

            "Firestore database and FieldValue are required."

        );

    }

    /**

     * Credit a player's wallet.

     *

     * All amounts are stored in kobo.

     *

     * @param {Object} payment

     */

    async function creditWallet({

        uid,

        reference,

        amountKobo,

        currency

    }) {

        if (

            typeof uid !== "string" ||

            !uid ||

            typeof reference !== "string" ||

            !reference ||

            !Number.isSafeInteger(amountKobo) ||

            amountKobo <= 0 ||

            currency !== "NGN"

        ) {

            throw createError(

                ERROR_CODES.INVALID_ARGUMENT,

                "Invalid wallet credit information."

            );

        }

        const playerRef = db

            .collection("players")

            .doc(uid);

        const orderRef = db

            .collection("paymentOrders")

            .doc(reference);

        const paymentRef = db

            .collection("payments")

            .doc(reference);

        const walletTransactionRef = db

            .collection("walletTransactions")

            .doc(reference);

        return db.runTransaction(async (transaction) => {

            // All Firestore reads must happen before writes.

            const [

                playerSnapshot,

                orderSnapshot,

                paymentSnapshot,

                walletTransactionSnapshot

            ] = await Promise.all([

                transaction.get(playerRef),

                transaction.get(orderRef),

                transaction.get(paymentRef),

                transaction.get(walletTransactionRef)

            ]);

            // Duplicate protection.

            if (paymentSnapshot.exists) {

                return {

                    success: true,

                    status: "ALREADY_CREDITED",

                    message: "Payment has already been processed."

                };

            }

            if (walletTransactionSnapshot.exists) {

                throw createError(

                    ERROR_CODES.FAILED_PRECONDITION,

                    "Wallet transaction exists without its payment record."

                );

            }

            // Verify player.

            if (!playerSnapshot.exists) {

                throw createError(

                    ERROR_CODES.NOT_FOUND,

                    "Player account does not exist."

                );

            }

            // Verify purchase order.

            if (!orderSnapshot.exists) {

                throw createError(

                    ERROR_CODES.NOT_FOUND,

                    "Payment order does not exist."

                );

            }

            const order = orderSnapshot.data();

            if (

                order.uid !== uid ||

                order.status !== "pending" ||

                order.amountKobo !== amountKobo ||

                order.currency !== currency

            ) {

                throw createError(

                    ERROR_CODES.FAILED_PRECONDITION,

                    "Payment does not match the original purchase order."

                );

            }

            // Read current wallet balance.

            const player = playerSnapshot.data();

            const currentBalance =

                player.walletBalanceKobo ?? 0;

            if (

                !Number.isSafeInteger(currentBalance) ||

                currentBalance < 0

            ) {

                throw createError(

                    ERROR_CODES.INTERNAL,

                    "Player wallet balance is invalid."

                );

            }

            const newBalance =

                currentBalance + amountKobo;

            if (!Number.isSafeInteger(newBalance)) {

                throw createError(

                    ERROR_CODES.INTERNAL,

                    "Wallet balance exceeds supported limits."

                );

            }

            // Record successful payment.

            transaction.create(paymentRef, {

                uid,

                reference,

                amountKobo,

                currency,

                status: "success",

                createdAt: FieldValue.serverTimestamp()

            });

            // Credit wallet.

            transaction.update(playerRef, {

                walletBalanceKobo: newBalance,

                walletUpdatedAt: FieldValue.serverTimestamp()

            });

            // Create immutable wallet transaction record.

            transaction.create(walletTransactionRef, {

                uid,

                reference,

                type: "credit",

                amountKobo,

                currency,

                balanceBeforeKobo: currentBalance,

                balanceAfterKobo: newBalance,

                createdAt: FieldValue.serverTimestamp()

            });

            // Mark order completed.

            transaction.update(orderRef, {

                status: "paid",

                paidAt: FieldValue.serverTimestamp()

            });

            return {

                success: true,

                status: "CREDITED",

                amountKobo,

                balanceAfterKobo: newBalance

            };

        });

    }

    return {

        creditWallet

    };

}

module.exports = {

    createWalletService

};
