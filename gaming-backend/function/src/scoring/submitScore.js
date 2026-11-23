"use strict";

const {
    validateScoreSubmission
} = require("./scoreValidation");

const {
    createError,
    ERROR_CODES
} = require("../utils/errors");

/**
 * Convert a Firestore timestamp or Date into milliseconds.
 */
function toMillis(value) {
    if (value && typeof value.toMillis === "function") {
        return value.toMillis();
    }

    if (value instanceof Date) {
        return value.getTime();
    }

    return NaN;
}

/**
 * Generate a UTC calendar date key.
 * Example: 2026-11-23
 */
function getUtcDateKey(date) {
    return date.toISOString().slice(0, 10);
}

/**
 * Generate an ISO week identifier.
 * Example: 2026-W48
 */
function getIsoWeekKey(date) {
    const utcDate = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));

    const day = utcDate.getUTCDay() || 7;

    utcDate.setUTCDate(
        utcDate.getUTCDate() + 4 - day
    );

    const year = utcDate.getUTCFullYear();

    const yearStart = new Date(Date.UTC(year, 0, 1));

    const week = Math.ceil(
        (((utcDate - yearStart) / 86400000) + 1) / 7
    );

    return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Create the score processing service.
 *
 * Firebase dependencies are injected later.
 *
 * @param {Object} dependencies
 * @param {Object} dependencies.db Firestore instance
 * @param {Object} dependencies.FieldValue Firestore FieldValue
 * @param {Object} dependencies.config Scoring configuration
 */
function createSubmitScoreService({
    db,
    FieldValue,
    config
}) {
    if (!db || !FieldValue || !config) {
        throw new TypeError(
            "Database, FieldValue and configuration are required."
        );
    }

    const {
        maxScorePerMinute,
        dailyScoreCap,
        maxSessionDurationSeconds
    } = config;

    if (
        !Number.isFinite(maxScorePerMinute) ||
        maxScorePerMinute <= 0 ||
        !Number.isSafeInteger(dailyScoreCap) ||
        dailyScoreCap <= 0 ||
        !Number.isFinite(maxSessionDurationSeconds) ||
        maxSessionDurationSeconds <= 0
    ) {
        throw new TypeError(
            "Invalid score processing configuration."
        );
    }

    /**
     * Process a player's completed game session.
     *
     * uid must come from verified Firebase authentication.
     * sessionId identifies a server-created game session.
     * score is the player's submitted final score.
     */
    return async function submitScore({
        uid,
        sessionId,
        score
    }) {
        if (
            typeof uid !== "string" ||
            !uid.trim() ||
            typeof sessionId !== "string" ||
            !sessionId.trim()
        ) {
            throw createError(
                ERROR_CODES.INVALID_ARGUMENT,
                "A valid player ID and session ID are required."
            );
        }

        if (!Number.isSafeInteger(score) || score < 0) {
            throw createError(
                ERROR_CODES.INVALID_ARGUMENT,
                "Score must be a non-negative safe integer."
            );
        }

        const playerRef = db.collection("players").doc(uid);

        const sessionRef = db
            .collection("gameSessions")
            .doc(sessionId);

        const submissionRef = playerRef
            .collection("scoreSubmissions")
            .doc(sessionId);

        const auditRef = db.collection("auditLogs").doc();

        return db.runTransaction(async (transaction) => {

            // All reads happen before any writes.

            const [
                playerSnapshot,
                sessionSnapshot,
                submissionSnapshot
            ] = await Promise.all([
                transaction.get(playerRef),
                transaction.get(sessionRef),
                transaction.get(submissionRef)
            ]);

            const now = new Date();

            const dateKey = getUtcDateKey(now);
            const weekKey = getIsoWeekKey(now);

            const dailyRef = db
                .collection("dailyStats")
                .doc(`${uid}_${dateKey}`);

            const leaderboardRef = db
                .collection("weeklyLeaderboards")
                .doc(weekKey)
                .collection("players")
                .doc(uid);

            const dailySnapshot = await transaction.get(dailyRef);

            const leaderboardSnapshot = await transaction.get(
                leaderboardRef
            );

            /**
             * Helper for writing an audit record.
             */
            const writeAudit = (eventType, details = {}) => {
                transaction.set(auditRef, {
                    uid,
                    sessionId,
                    eventType,
                    details,
                    createdAt: FieldValue.serverTimestamp()
                });
            };

            // 1. Prevent duplicate session submissions.

            if (submissionSnapshot.exists) {
                writeAudit("DUPLICATE_SCORE_SUBMISSION");

                return {
                    success: false,
                    status: "DUPLICATE_SUBMISSION",
                    message: "This session has already been submitted."
                };
            }

            // 2. Confirm player exists.

            if (!playerSnapshot.exists) {
                writeAudit("UNKNOWN_PLAYER");

                return {
                    success: false,
                    status: "PLAYER_NOT_FOUND",
                    message: "Player profile does not exist."
                };
            }

            // 3. Verify the game session.

            if (!sessionSnapshot.exists) {
                writeAudit("UNKNOWN_SESSION");

                return {
                    success: false,
                    status: "SESSION_NOT_FOUND",
                    message: "Game session does not exist."
                };
            }

            const session = sessionSnapshot.data();

            if (
                session.uid !== uid ||
                session.status !== "active"
            ) {
                writeAudit("INVALID_SESSION");

                return {
                    success: false,
                    status: "INVALID_SESSION",
                    message: "Session is invalid or unavailable."
                };
            }

            // 4. Calculate duration using trusted server data.

            const startedAt = toMillis(session.startedAt);
            const currentTime = now.getTime();

            const durationSeconds = Math.floor(
                (currentTime - startedAt) / 1000
            );

            if (
                !Number.isFinite(startedAt) ||
                durationSeconds <= 0 ||
                durationSeconds > maxSessionDurationSeconds
            ) {
                writeAudit("INVALID_SESSION_DURATION", {
                    durationSeconds
                });

                return {
                    success: false,
                    status: "INVALID_SESSION_DURATION",
                    message: "Session duration is invalid."
                };
            }

            // 5. Read the player's existing daily score.

            const dailyData = dailySnapshot.exists
                ? dailySnapshot.data()
                : {};

            const currentDailyScore =
                dailyData.creditedScore ?? 0;

            if (
                !Number.isSafeInteger(currentDailyScore) ||
                currentDailyScore < 0 ||
                currentDailyScore > dailyScoreCap
            ) {
                throw createError(
                    ERROR_CODES.INTERNAL,
                    "Daily scoring data is invalid."
                );
            }

            const remainingDailyCap = Math.max(
                0,
                dailyScoreCap - currentDailyScore
            );

            // 6. Validate the submitted score.

            const validation = validateScoreSubmission(
                {
                    score,
                    sessionDurationSeconds: durationSeconds,
                    remainingDailyCap
                },
                {
                    maxScorePerMinute
                }
            );

            // 7. Record rejected scores.

            if (!validation.valid) {
                writeAudit("REJECTED_SCORE", {
                    submittedScore: score,
                    reason: validation.status,
                    maximumPossibleScore:
                        validation.maximumPossibleScore ?? null
                });

                return {
                    success: false,
                    ...validation
                };
            }

            // 8. Calculate new leaderboard score.

            const leaderboardData = leaderboardSnapshot.exists
                ? leaderboardSnapshot.data()
                : {};

            const currentWeeklyScore =
                leaderboardData.score ?? 0;

            if (
                !Number.isSafeInteger(currentWeeklyScore) ||
                currentWeeklyScore < 0
            ) {
                throw createError(
                    ERROR_CODES.INTERNAL,
                    "Weekly leaderboard data is invalid."
                );
            }

            const newDailyScore =
                currentDailyScore + validation.creditedScore;

            const newWeeklyScore =
                currentWeeklyScore + validation.creditedScore;

            if (
                !Number.isSafeInteger(newDailyScore) ||
                !Number.isSafeInteger(newWeeklyScore)
            ) {
                throw createError(
                    ERROR_CODES.INTERNAL,
                    "Score total exceeds supported limits."
                );
            }

            // 9. Record successful score submission.

            transaction.create(submissionRef, {
                uid,
                sessionId,
                submittedScore: score,
                creditedScore: validation.creditedScore,
                status: validation.status,
                dateKey,
                weekKey,
                createdAt: FieldValue.serverTimestamp()
            });

            // 10. Complete the game session.

            transaction.update(sessionRef, {
                status: "completed",
                finalScore: score,
                creditedScore: validation.creditedScore,
                endedAt: FieldValue.serverTimestamp()
            });

            // 11. Update daily scoring statistics.

            transaction.set(dailyRef, {
                uid,
                dateKey,
                creditedScore: newDailyScore,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });

            // 12. Update weekly leaderboard.

            transaction.set(leaderboardRef, {
                uid,
                weekKey,
                score: newWeeklyScore,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });

            // 13. Write audit log.

            writeAudit("ACCEPTED_SCORE", {
                submittedScore: score,
                creditedScore: validation.creditedScore,
                rejectedScore: validation.rejectedScore,
                dateKey,
                weekKey
            });

            return {
                success: true,
                status: validation.status,
                submittedScore: score,
                creditedScore: validation.creditedScore,
                weeklyScore: newWeeklyScore,
                remainingDailyCap:
                    dailyScoreCap - newDailyScore
            };
        });
    };
}

module.exports = {
    createSubmitScoreService,
    getUtcDateKey,
    getIsoWeekKey
};
