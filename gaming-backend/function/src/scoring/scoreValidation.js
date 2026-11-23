"use strict";

/**
 * Validates a player's end-of-session score.
 *
 * This function is intentionally independent of Firebase.
 * It only performs business-rule validation.
 *
 * Database reads, authentication, session verification,
 * transactions and audit logging will be handled separately.
 *
 * @param {Object} submission
 * @param {number} submission.score
 * @param {number} submission.sessionDurationSeconds
 * @param {number} submission.remainingDailyCap
 *
 * @param {Object} config
 * @param {number} config.maxScorePerMinute
 *
 * @returns {Object} Validation result
 */

function validateScoreSubmission(submission, config) {
    // 1. Validate input objects

    if (
        !submission ||
        typeof submission !== "object" ||
        !config ||
        typeof config !== "object"
    ) {
        throw new TypeError("Invalid submission or configuration.");
    }

    const {
        score,
        sessionDurationSeconds,
        remainingDailyCap
    } = submission;

    const { maxScorePerMinute } = config;

    // 2. Validate submitted score

    if (!Number.isSafeInteger(score) || score < 0) {
        return {
            valid: false,
            status: "INVALID_SCORE",
            message: "Score must be a non-negative safe integer.",
            submittedScore: score,
            creditedScore: 0
        };
    }

    // 3. Validate session duration

    if (
        !Number.isFinite(sessionDurationSeconds) ||
        sessionDurationSeconds <= 0
    ) {
        return {
            valid: false,
            status: "INVALID_SESSION_DURATION",
            message: "Session duration must be greater than zero.",
            submittedScore: score,
            creditedScore: 0
        };
    }

    // 4. Validate daily cap information

    if (
        !Number.isSafeInteger(remainingDailyCap) ||
        remainingDailyCap < 0
    ) {
        throw new TypeError("Invalid remaining daily score allowance.");
    }

    // 5. Validate scoring configuration

    if (
        !Number.isFinite(maxScorePerMinute) ||
        maxScorePerMinute <= 0
    ) {
        throw new TypeError("Invalid maximum score configuration.");
    }

    // 6. Calculate the maximum achievable score

    const maximumPossibleScore = Math.floor(
        (sessionDurationSeconds / 60) * maxScorePerMinute
    );

    // 7. Reject impossible score gains

    if (score > maximumPossibleScore) {
        return {
            valid: false,
            status: "IMPOSSIBLE_SCORE_GAIN",
            message: "Submitted score exceeds the permitted session score.",
            submittedScore: score,
            maximumPossibleScore,
            creditedScore: 0
        };
    }

    // 8. Apply the remaining daily allowance

    const creditedScore = Math.min(
        score,
        remainingDailyCap
    );

    // 9. Determine submission status

    let status = "ACCEPTED";
    let message = "Score successfully validated.";

    if (remainingDailyCap === 0) {
        status = "DAILY_CAP_REACHED";
        message = "The player's daily scoring allowance has been exhausted.";
    } else if (creditedScore < score) {
        status = "DAILY_CAP_PARTIAL";
        message = "Only the remaining daily allowance was credited.";
    }

    // 10. Return validation result

    return {
        valid: true,
        status,
        message,

        submittedScore: score,
        maximumPossibleScore,

        creditedScore,

        rejectedScore: score - creditedScore
    };
}

module.exports = {
    validateScoreSubmission
};
