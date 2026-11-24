export class EconomySystems {

    constructor(playerData = {}) {

        this.playerData = playerData;

        if (
            typeof this.playerData.cash !== "number"
        ) {

            this.playerData.cash = 50000;

        }

        if (
            typeof this.playerData.bank !== "number"
        ) {

            this.playerData.bank = 0;

        }

        this.lastTransaction = null;

    }

    // =====================================
    // BALANCE
    // =====================================

    getBalance(method) {

        if (method === "cash") {

            return Math.max(
                0,
                this.playerData.cash
            );

        }

        if (method === "bank") {

            return Math.max(
                0,
                this.playerData.bank
            );

        }

        return 0;

    }

    // =====================================
    // TOTAL MONEY
    // =====================================

    getTotalMoney() {

        return (
            this.getBalance("cash") +
            this.getBalance("bank")
        );

    }

    // =====================================
    // CHECK PAYMENT
    // =====================================

    canAfford(
        amount,
        method
    ) {

        if (
            typeof amount !== "number" ||
            amount <= 0
        ) {

            return false;

        }

        return (
            this.getBalance(method) >=
            amount
        );

    }

    // =====================================
    // PURCHASE
    // =====================================

    purchase({
        item,
        amount,
        paymentMethod = "cash"
    }) {

        if (
            !item ||
            typeof item !== "string"
        ) {

            return {
                success: false,
                message: "Invalid item."
            };

        }

        if (
            typeof amount !== "number" ||
            amount <= 0
        ) {

            return {
                success: false,
                message: "Invalid price."
            };

        }

        if (
            paymentMethod !== "cash" &&
            paymentMethod !== "bank"
        ) {

            return {
                success: false,
                message:
                    "Invalid payment method."
            };

        }

        if (
            !this.canAfford(
                amount,
                paymentMethod
            )
        ) {

            return {
                success: false,
                message:
                    paymentMethod === "cash"
                        ? "Not enough cash."
                        : "Insufficient bank balance."
            };

        }

        if (
            paymentMethod === "cash"
        ) {

            this.playerData.cash -=
                amount;

        } else {

            this.playerData.bank -=
                amount;

        }

        this.lastTransaction = {

            id:
                `TX-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,

            type: "purchase",

            item,

            amount,

            paymentMethod,

            timestamp:
                Date.now()

        };

        return {

            success: true,

            message:
                `${item} purchased successfully.`,

            transaction:
                this.lastTransaction,

            remainingBalance:
                this.getBalance(
                    paymentMethod
                )

        };

    }

    // =====================================
    // DEPOSIT
    // =====================================

    deposit(amount) {

        if (
            typeof amount !== "number" ||
            amount <= 0
        ) {

            return {
                success: false,
                message: "Invalid amount."
            };

        }

        if (
            this.playerData.cash <
            amount
        ) {

            return {
                success: false,
                message:
                    "Not enough cash."
            };

        }

        this.playerData.cash -=
            amount;

        this.playerData.bank +=
            amount;

        return {

            success: true,

            message:
                "Cash deposited successfully."

        };

    }

    // =====================================
    // WITHDRAW
    // =====================================

    withdraw(amount) {

        if (
            typeof amount !== "number" ||
            amount <= 0
        ) {

            return {
                success: false,
                message:
                    "Invalid amount."
            };

        }

        if (
            this.playerData.bank <
            amount
        ) {

            return {
                success: false,
                message:
                    "Insufficient bank balance."
            };

        }

        this.playerData.bank -=
            amount;

        this.playerData.cash +=
            amount;

        return {

            success: true,

            message:
                "Cash withdrawn successfully."

        };

    }

    // =====================================
    // ADD MONEY
    // =====================================

    addMoney(
        amount,
        method = "cash"
    ) {

        if (
            typeof amount !== "number" ||
            amount <= 0
        ) {

            return false;

        }

        if (
            method === "cash"
        ) {

            this.playerData.cash +=
                amount;

        } else if (
            method === "bank"
        ) {

            this.playerData.bank +=
                amount;

        } else {

            return false;

        }

        return true;

    }

}
