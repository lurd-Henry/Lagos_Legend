"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const {
    verifyPaystackSignature,
    validatePaystackEvent
} = require("./paymentValidation");

const secret = "test-paystack-secret";

function createSignature(payload) {
    return crypto
        .createHmac("sha512", secret)
        .update(payload)
        .digest("hex");
}

test("Accepts a valid Paystack webhook signature", () => {
    const rawBody = Buffer.from(
        JSON.stringify({
            event: "charge.success"
        })
    );

    const signature = createSignature(rawBody);

    assert.equal(
        verifyPaystackSignature(rawBody, signature, secret),
        true
    );
});

test("Rejects an invalid webhook signature", () => {
    const rawBody = Buffer.from("test payload");

    assert.equal(
        verifyPaystackSignature(
            rawBody,
            "invalid-signature",
            secret
        ),
        false
    );
});

test("Accepts a valid successful payment event", () => {
    const event = {
        event: "charge.success",
        data: {
            reference: "PAY-12345",
            amount: 500000,
            currency: "NGN",
            status: "success"
        }
    };

    const result = validatePaystackEvent(event);

    assert.equal(result.reference, "PAY-12345");
    assert.equal(result.amountKobo, 500000);
    assert.equal(result.currency, "NGN");
});

test("Ignores unrelated Paystack events", () => {
    const result = validatePaystackEvent({
        event: "subscription.create",
        data: {}
    });

    assert.equal(result, null);
});

test("Rejects invalid payment amounts", () => {
    assert.throws(
        () => validatePaystackEvent({
            event: "charge.success",
            data: {
                reference: "PAY-12345",
                amount: -500,
                currency: "NGN",
                status: "success"
            }
        }),
        {
            code: "INVALID_ARGUMENT"
        }
    );
});

test("Rejects unsupported currencies", () => {
    assert.throws(
        () => validatePaystackEvent({
            event: "charge.success",
            data: {
                reference: "PAY-12345",
                amount: 500000,
                currency: "USD",
                status: "success"
            }
        }),
        {
            code: "INVALID_ARGUMENT"
        }
    );
});
