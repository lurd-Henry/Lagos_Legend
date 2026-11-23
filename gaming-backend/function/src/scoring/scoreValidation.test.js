"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    validateScoreSubmission
} = require("./scoreValidation");

const config = {
    maxScorePerMinute: 100
};

test("Accepts a legitimate score", () => {
    const result = validateScoreSubmission(
        {
            score: 450,
            sessionDurationSeconds: 300,
            remainingDailyCap: 1000
        },
        config
    );

    assert.equal(result.valid, true);
    assert.equal(result.status, "ACCEPTED");
    assert.equal(result.creditedScore, 450);
});

test("Rejects an impossible score gain", () => {
    const result = validateScoreSubmission(
        {
            score: 900,
            sessionDurationSeconds: 300,
            remainingDailyCap: 1000
        },
        config
    );

    assert.equal(result.valid, false);
    assert.equal(result.status, "IMPOSSIBLE_SCORE_GAIN");
    assert.equal(result.creditedScore, 0);
});

test("Applies the remaining daily cap", () => {
    const result = validateScoreSubmission(
        {
            score: 450,
            sessionDurationSeconds: 300,
            remainingDailyCap: 200
        },
        config
    );

    assert.equal(result.valid, true);
    assert.equal(result.status, "DAILY_CAP_PARTIAL");
    assert.equal(result.creditedScore, 200);
    assert.equal(result.rejectedScore, 250);
});

test("Rejects invalid negative scores", () => {
    const result = validateScoreSubmission(
        {
            score: -100,
            sessionDurationSeconds: 300,
            remainingDailyCap: 1000
        },
        config
    );

    assert.equal(result.valid, false);
    assert.equal(result.status, "INVALID_SCORE");
});

test("Prevents scoring after daily cap exhaustion", () => {
    const result = validateScoreSubmission(
        {
            score: 300,
            sessionDurationSeconds: 300,
            remainingDailyCap: 0
        },
        config
    );

    assert.equal(result.valid, true);
    assert.equal(result.status, "DAILY_CAP_REACHED");
    assert.equal(result.creditedScore, 0);
});

test("Rejects invalid session durations", () => {
    const result = validateScoreSubmission(
        {
            score: 100,
            sessionDurationSeconds: 0,
            remainingDailyCap: 1000
        },
        config
    );

    assert.equal(result.valid, false);
    assert.equal(result.status, "INVALID_SESSION_DURATION");
});
