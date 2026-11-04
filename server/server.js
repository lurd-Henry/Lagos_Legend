import express from "express";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "1mb" }));

app.use(express.static(
    path.join(__dirname, "../public")
));


// ==========================================
// DATABASE CONNECTION
// ==========================================

const pool = process.env.DATABASE_URL
    ? new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 5
    })
    : null;


// ==========================================
// SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL = (
    process.env.SUPABASE_URL || ""
).trim().replace(/\/+$/, "");

const SUPABASE_ANON_KEY = (
    process.env.SUPABASE_ANON_KEY || ""
).trim();
// ==========================================
// SUPABASE CONFIGURATION DIAGNOSTICS
// ==========================================

let urlProjectRef = null;
let keyProjectRef = null;

try {
    urlProjectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
} catch {
    console.error("SUPABASE_URL is invalid.");
}

try {
    const parts = SUPABASE_ANON_KEY.split(".");

    if (parts.length === 3) {
        const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString()
        );

        keyProjectRef = payload.ref || null;
    }
} catch {
    console.log("Could not decode legacy API key.");
}

console.log("SUPABASE CONFIGURATION:", {
    urlConfigured: Boolean(SUPABASE_URL),
    keyConfigured: Boolean(SUPABASE_ANON_KEY),
    urlProjectRef,
    keyProjectRef,
    projectsMatch: urlProjectRef && keyProjectRef
        ? urlProjectRef === keyProjectRef
        : "Cannot verify"
});

console.log("SUPABASE CONFIG CHECK:", {
    urlConfigured: Boolean(SUPABASE_URL),
    keyConfigured: Boolean(SUPABASE_ANON_KEY),
    urlHost: SUPABASE_URL
        ? new URL(SUPABASE_URL).host
        : "MISSING",
    keyType: SUPABASE_ANON_KEY?.startsWith("eyJ")
        ? "Legacy JWT"
        : SUPABASE_ANON_KEY?.startsWith("sb_publishable_")
            ? "Publishable key"
            : "Unknown or missing"
});

async function supabaseRequest(endpoint, method = "GET", body = null, token = null) {

    const headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY
    };

    // Only send Authorization when we have an actual user access token.
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${SUPABASE_URL}/auth/v1/${endpoint}`,
        {
            method,
            headers,
            ...(body ? {
                body: JSON.stringify(body)
            } : {})
        }
    );

    const responseText = await response.text();

    let data;

    try {
        data = JSON.parse(responseText);
    } catch {
        data = { message: responseText };
    }

    if (!response.ok) {
        console.error("SUPABASE AUTH ERROR:", {
            endpoint,
            status: response.status,
            response: data
        });

        throw new Error(
            data.msg ||
            data.message ||
            data.error_description ||
            data.error ||
            "Supabase authentication failed."
        );
    }

    return data;
}

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

async function authenticate(req, res, next) {

    try {

        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "error",
                message: "Please log in first."
            });
        }

        const token = authorization.substring(7);

        const user = await supabaseRequest(
            "user",
            "GET",
            null,
            token
        );

        if (!user.id) {
            return res.status(401).json({
                status: "error",
                message: "Invalid session."
            });
        }

        req.user = user;

        next();

    } catch (error) {

        res.status(401).json({
            status: "error",
            message: "Authentication failed. Please log in again."
        });

    }
}


// ==========================================
// CREATE PLAYER PROFILE
// ==========================================

async function createPlayerProfile(user) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const username = user.user_metadata?.username;

        if (!username) {
            throw new Error("Username is missing.");
        }

        const playerResult = await client.query(
            `INSERT INTO players (id, username)
             VALUES ($1, $2)
             ON CONFLICT (id) DO NOTHING
             RETURNING id`,
            [user.id, username]
        );

        if (playerResult.rowCount === 0) {

            const existing = await client.query(
                "SELECT id FROM players WHERE id = $1",
                [user.id]
            );

            if (existing.rowCount === 0) {
                throw new Error("Player profile could not be created.");
            }

        }

        await client.query(
            `INSERT INTO player_wallets (player_id)
             VALUES ($1)
             ON CONFLICT (player_id) DO NOTHING`,
            [user.id]
        );

        await client.query(
            `INSERT INTO player_needs (player_id)
             VALUES ($1)
             ON CONFLICT (player_id) DO NOTHING`,
            [user.id]
        );

        // STARTER GRANT — EXACTLY ONCE

        const grant = await client.query(
            `UPDATE player_wallets
             SET cash = cash + 50000,
                 starter_grant_claimed = TRUE,
                 updated_at = NOW()
             WHERE player_id = $1
             AND starter_grant_claimed = FALSE
             RETURNING player_id`,
            [user.id]
        );

        if (grant.rowCount > 0) {

            await client.query(
                `INSERT INTO transactions
                 (player_id, transaction_type, amount, destination, description, idempotency_key)
                 VALUES ($1, 'starter_grant', 50000, 'cash',
                 'Lagos Legends welcome grant',
                 'starter-grant-v1')`,
                [user.id]
            );

        }

        await client.query("COMMIT");

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();

    }
}


// ==========================================
// SERVER HEALTH
// ==========================================

app.get("/api/health", (req, res) => {

    res.json({
        status: "online",
        game: "Lagos Legends",
        message: "Game server is running."
    });

});


// ==========================================
// NIGERIAN SERVER TIME
// ==========================================

app.get("/api/time", (req, res) => {

    const now = new Date();

    const time = new Intl.DateTimeFormat("en-NG", {
        timeZone: "Africa/Lagos",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    }).format(now);

    const date = new Intl.DateTimeFormat("en-NG", {
        timeZone: "Africa/Lagos",
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(now);

    res.json({
        status: "success",
        timezone: "Africa/Lagos",
        epochMs: now.getTime(),
        time,
        date
    });

});


// ==========================================
// DATABASE HEALTH
// ==========================================

app.get("/api/db-health", async (req, res) => {

    if (!pool) {
        return res.status(503).json({
            status: "disconnected",
            message: "Database URL has not been configured."
        });
    }

    try {

        const result = await pool.query(
            "SELECT NOW() AS server_time"
        );

        res.json({
            status: "connected",
            database: "Lagos Legends",
            time: result.rows[0].server_time
        });

    } catch (error) {

        console.error("Database error:", error.message);

        res.status(500).json({
            status: "error",
            message: "Database connection failed."
        });

    }

});


// ==========================================
// PLAYER REGISTRATION
// ==========================================

app.post("/api/auth/register", async (req, res) => {

    try {

        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({
                status: "error",
                message: "Email, password and username are required."
            });
        }

        if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
            return res.status(400).json({
                status: "error",
                message: "Username must be 3–24 characters and contain only letters, numbers or underscores."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                status: "error",
                message: "Password must contain at least 8 characters."
            });
        }

        const data = await supabaseRequest(
            "signup",
            "POST",
            {
                email,
                password,
                data: {
                    username
                }
            }
        );

        res.status(201).json({
            status: "success",
            message: data.session
                ? "Account created successfully."
                : "Account created. Please verify your email before logging in.",
            requiresEmailVerification: !data.session,
            session: data.session
                ? {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token
                }
                : null
        });

    } catch (error) {

        res.status(400).json({
            status: "error",
            message: error.message
        });

    }

});


// ==========================================
// PLAYER LOGIN
// ==========================================

app.post("/api/auth/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                message: "Email and password are required."
            });
        }

        const data = await supabaseRequest(
            "token?grant_type=password",
            "POST",
            {
                email,
                password
            }
        );

        // Ensure the player profile exists.
        await createPlayerProfile(data.user);

        res.json({
            status: "success",
            message: "Welcome back to Lagos Legends.",
            session: {
                access_token: data.access_token,
                refresh_token: data.refresh_token
            }
        });

    } catch (error) {

        console.error("Login error:", error.message);

        res.status(400).json({
            status: "error",
            message: error.message
        });

    }

});


// ==========================================
// PLAYER PROFILE
// ==========================================

app.get("/api/player/me", authenticate, async (req, res) => {

    try {

        await createPlayerProfile(req.user);

        const result = await pool.query(
            `SELECT
                p.id,
                p.username,
                p.character_name,
                p.appearance,
                p.character_created,
                w.cash,
                w.bank,
                n.hunger
             FROM players p
             JOIN player_wallets w ON w.player_id = p.id
             JOIN player_needs n ON n.player_id = p.id
             WHERE p.id = $1`,
            [req.user.id]
        );

        res.json({
            status: "success",
            player: result.rows[0]
        });

    } catch (error) {

        console.error("Profile error:", error.message);

        res.status(500).json({
            status: "error",
            message: "Unable to load player profile."
        });

    }

});
// ==========================================
// GET PLAYER WALLET
// ==========================================

app.get("/api/banking/wallet", authenticate, async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT cash, bank
             FROM player_wallets
             WHERE player_id = $1`,
            [req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                status: "error",
                message: "Wallet not found."
            });
        }

        res.json({
            status: "success",
            wallet: result.rows[0]
        });

    } catch (error) {

        console.error("Wallet error:", error.message);

        res.status(500).json({
            status: "error",
            message: "Unable to retrieve wallet."
        });

    }

});

// ==========================================
// SAVE CHARACTER
// ==========================================

app.post("/api/player/character", authenticate, async (req, res) => {

    try {

        const { character_name, appearance } = req.body;

        const allowed = {
            skin: 4,
            hair: 3,
            hairstyle: 4,
            top: 5,
            trousers: 4,
            shoes: 3
        };

        if (
            typeof character_name !== "string" ||
            character_name.trim().length < 2 ||
            character_name.trim().length > 40 ||
            !appearance ||
            typeof appearance !== "object" ||
            Array.isArray(appearance)
        ) {
            return res.status(400).json({
                status: "error",
                message: "Invalid character details."
            });
        }

        for (const [key, count] of Object.entries(allowed)) {

            const value = appearance[key];

            if (
                !Number.isInteger(value) ||
                value < 0 ||
                value >= count
            ) {
                return res.status(400).json({
                    status: "error",
                    message: `Invalid character option: ${key}`
                });
            }

        }

        const result = await pool.query(
            `UPDATE players
             SET character_name = $1,
                 appearance = $2,
                 character_created = TRUE,
                 updated_at = NOW()
             WHERE id = $3
             RETURNING id, username, character_name, appearance, character_created`,
            [
                character_name.trim(),
                JSON.stringify(appearance),
                req.user.id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                status: "error",
                message: "Player profile not found."
            });
        }

        res.json({
            status: "success",
            message: "Character saved successfully.",
            character: result.rows[0]
        });

    } catch (error) {

        console.error("Character save error:", error.message);

        res.status(500).json({
            status: "error",
            message: "Unable to save character."
        });

    }

});
// ==========================================
// BANKING SYSTEM
// ==========================================

const MAX_TRANSACTION_AMOUNT = 1000000000;


// ==========================================
// DEPOSIT / WITHDRAWAL
// ==========================================

async function processBankTransaction(req, res, type) {

    const { amount, idempotencyKey } = req.body;

    // Validate amount
    if (
        !Number.isSafeInteger(amount) ||
        amount <= 0 ||
        amount > MAX_TRANSACTION_AMOUNT
    ) {
        return res.status(400).json({
            status: "error",
            message: "Enter a valid transaction amount."
        });
    }

    // Validate request key
    if (
        typeof idempotencyKey !== "string" ||
        !/^[a-zA-Z0-9_-]{8,100}$/.test(idempotencyKey)
    ) {
        return res.status(400).json({
            status: "error",
            message: "Invalid transaction request."
        });
    }

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        // Lock the player's wallet to prevent simultaneous
        // transactions from corrupting the balance.

        const walletResult = await client.query(
            `SELECT cash, bank
             FROM player_wallets
             WHERE player_id = $1
             FOR UPDATE`,
            [req.user.id]
        );

        if (walletResult.rowCount === 0) {
            throw new Error("Player wallet not found.");
        }

        // Check whether this request was already processed.

        const previousTransaction = await client.query(
            `SELECT transaction_type, amount
             FROM transactions
             WHERE player_id = $1
             AND idempotency_key = $2`,
            [req.user.id, idempotencyKey]
        );

        if (previousTransaction.rowCount > 0) {

            const previous = previousTransaction.rows[0];

            if (
                previous.transaction_type !== type ||
                Number(previous.amount) !== amount
            ) {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    status: "error",
                    message: "This transaction key has already been used."
                });
            }

            const currentWallet = await client.query(
                `SELECT cash, bank
                 FROM player_wallets
                 WHERE player_id = $1`,
                [req.user.id]
            );

            await client.query("COMMIT");

            return res.json({
                status: "success",
                message: "Transaction already processed.",
                wallet: currentWallet.rows[0]
            });

        }

        const wallet = walletResult.rows[0];

        if (type === "deposit") {

            if (BigInt(wallet.cash) < BigInt(amount)) {
                throw new Error("Insufficient cash balance.");
            }

            await client.query(
                `UPDATE player_wallets
                 SET cash = cash - $1,
                     bank = bank + $1,
                     updated_at = NOW()
                 WHERE player_id = $2`,
                [amount, req.user.id]
            );

        } else {

            if (BigInt(wallet.bank) < BigInt(amount)) {
                throw new Error("Insufficient bank balance.");
            }

            await client.query(
                `UPDATE player_wallets
                 SET bank = bank - $1,
                     cash = cash + $1,
                     updated_at = NOW()
                 WHERE player_id = $2`,
                [amount, req.user.id]
            );

        }

        // Record the transaction.

        await client.query(
            `INSERT INTO transactions
             (
                 player_id,
                 transaction_type,
                 amount,
                 source,
                 destination,
                 description,
                 idempotency_key
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                req.user.id,
                type,
                amount,
                type === "deposit" ? "cash" : "bank",
                type === "deposit" ? "bank" : "cash",
                type === "deposit"
                    ? "Cash deposited into bank"
                    : "Cash withdrawn from bank",
                idempotencyKey
            ]
        );

        const updatedWallet = await client.query(
            `SELECT cash, bank
             FROM player_wallets
             WHERE player_id = $1`,
            [req.user.id]
        );

        await client.query("COMMIT");

        res.json({
            status: "success",
            message: type === "deposit"
                ? "Deposit successful."
                : "Withdrawal successful.",
            wallet: updatedWallet.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        if (error.message === "Insufficient cash balance.") {
            return res.status(400).json({
                status: "error",
                message: error.message
            });
        }

        if (error.message === "Insufficient bank balance.") {
            return res.status(400).json({
                status: "error",
                message: error.message
            });
        }

        console.error("Banking error:", error.message);

        res.status(500).json({
            status: "error",
            message: "Transaction failed. Please try again."
        });

    } finally {

        client.release();

    }

}


// ==========================================
// DEPOSIT MONEY
// ==========================================

app.post(
    "/api/banking/deposit",
    authenticate,
    async (req, res) => {
        await processBankTransaction(req, res, "deposit");
    }
);


// ==========================================
// WITHDRAW MONEY
// ==========================================

app.post(
    "/api/banking/withdraw",
    authenticate,
    async (req, res) => {
        await processBankTransaction(req, res, "withdrawal");
    }
);


// ==========================================
// TRANSACTION HISTORY
// ==========================================

app.get(
    "/api/banking/transactions",
    authenticate,
    async (req, res) => {

        try {

            const result = await pool.query(
                `SELECT
                    id,
                    transaction_type,
                    amount,
                    source,
                    destination,
                    description,
                    created_at
                 FROM transactions
                 WHERE player_id = $1
                 ORDER BY created_at DESC
                 LIMIT 30`,
                [req.user.id]
            );

            res.json({
                status: "success",
                transactions: result.rows
            });

        } catch (error) {

            console.error("Transaction history error:", error.message);

            res.status(500).json({
                status: "error",
                message: "Unable to load transaction history."
            });

        }

    }
);
// ==========================================
// PLAYER-TO-PLAYER BANK TRANSFERS
// ==========================================

app.post(
    "/api/banking/transfer",
    authenticate,
    async (req, res) => {

        const { username, amount, idempotencyKey } = req.body;

        // Validate recipient username
        if (
            typeof username !== "string" ||
            !/^[a-zA-Z0-9_]{3,24}$/.test(username)
        ) {
            return res.status(400).json({
                status: "error",
                message: "Enter a valid recipient username."
            });
        }

        // Validate amount
        if (
            !Number.isSafeInteger(amount) ||
            amount <= 0 ||
            amount > MAX_TRANSACTION_AMOUNT
        ) {
            return res.status(400).json({
                status: "error",
                message: "Enter a valid transfer amount."
            });
        }

        // Validate request key
        if (
            typeof idempotencyKey !== "string" ||
            !/^[a-zA-Z0-9_-]{8,100}$/.test(idempotencyKey)
        ) {
            return res.status(400).json({
                status: "error",
                message: "Invalid transfer request."
            });
        }

        const client = await pool.connect();

        try {

            await client.query("BEGIN");

            // Find recipient
            const recipientResult = await client.query(
                `SELECT id, username
                 FROM players
                 WHERE LOWER(username) = LOWER($1)`,
                [username]
            );

            if (recipientResult.rowCount === 0) {
                throw new Error("Recipient not found.");
            }

            const recipient = recipientResult.rows[0];

            if (recipient.id === req.user.id) {
                throw new Error("You cannot transfer money to yourself.");
            }

            // Lock both wallets in a consistent order.
            // This reduces the risk of deadlocks.

            const walletIds = [
                req.user.id,
                recipient.id
            ].sort();

            const walletsResult = await client.query(
                `SELECT player_id, cash, bank
                 FROM player_wallets
                 WHERE player_id = ANY($1::uuid[])
                 ORDER BY player_id
                 FOR UPDATE`,
                [walletIds]
            );

            if (walletsResult.rowCount !== 2) {
                throw new Error("One of the player wallets could not be found.");
            }

            const senderWallet = walletsResult.rows.find(
                wallet => wallet.player_id === req.user.id
            );

            if (!senderWallet) {
                throw new Error("Your wallet could not be found.");
            }

            // Check whether this request was already processed.

            const previous = await client.query(
                `SELECT transaction_type, amount, description
                 FROM transactions
                 WHERE player_id = $1
                 AND idempotency_key = $2`,
                [req.user.id, idempotencyKey]
            );

            if (previous.rowCount > 0) {

                const transaction = previous.rows[0];

                if (
                    transaction.transaction_type !== "transfer" ||
                    Number(transaction.amount) !== amount ||
                    transaction.description !== `Transfer to @${recipient.username}`
                ) {
                    await client.query("ROLLBACK");

                    return res.status(409).json({
                        status: "error",
                        message: "This request key has already been used."
                    });
                }

                const currentWallet = await client.query(
                    `SELECT cash, bank
                     FROM player_wallets
                     WHERE player_id = $1`,
                    [req.user.id]
                );

                await client.query("COMMIT");

                return res.json({
                    status: "success",
                    message: "Transfer already processed.",
                    wallet: currentWallet.rows[0]
                });

            }

            // Check sender balance

            if (BigInt(senderWallet.bank) < BigInt(amount)) {
                throw new Error("Insufficient bank balance.");
            }

            // Deduct from sender and credit recipient

            await client.query(
                `UPDATE player_wallets
                 SET bank = bank - $1,
                     updated_at = NOW()
                 WHERE player_id = $2`,
                [amount, req.user.id]
            );

            await client.query(
                `UPDATE player_wallets
                 SET bank = bank + $1,
                     updated_at = NOW()
                 WHERE player_id = $2`,
                [amount, recipient.id]
            );

            // Record sender transaction

            await client.query(
                `INSERT INTO transactions
                 (
                    player_id,
                    transaction_type,
                    amount,
                    source,
                    destination,
                    description,
                    idempotency_key
                 )
                 VALUES ($1, 'transfer', $2, 'bank', 'player', $3, $4)`,
                [
                    req.user.id,
                    amount,
                    `Transfer to @${recipient.username}`,
                    idempotencyKey
                ]
            );

            // Record recipient transaction

            await client.query(
                `INSERT INTO transactions
                 (
                    player_id,
                    transaction_type,
                    amount,
                    source,
                    destination,
                    description
                 )
                 VALUES ($1, 'transfer', $2, 'player', 'bank', $3)`,
                [
                    recipient.id,
                    amount,
                    `Transfer received from @${senderWallet.player_id}`
                ]
            );

            // Get updated sender wallet

            const updatedWallet = await client.query(
                `SELECT cash, bank
                 FROM player_wallets
                 WHERE player_id = $1`,
                [req.user.id]
            );

            await client.query("COMMIT");

            res.json({
                status: "success",
                message: `Successfully transferred ₦${amount.toLocaleString("en-NG")} to @${recipient.username}.`,
                recipient: recipient.username,
                wallet: updatedWallet.rows[0]
            });

        } catch (error) {

            await client.query("ROLLBACK");

            if (
                error.message === "Recipient not found." ||
                error.message === "You cannot transfer money to yourself." ||
                error.message === "Insufficient bank balance." ||
                error.message === "Your wallet could not be found." ||
                error.message === "One of the player wallets could not be found."
            ) {
                return res.status(400).json({
                    status: "error",
                    message: error.message
                });
            }

            console.error("Transfer error:", error.message);

            res.status(500).json({
                status: "error",
                message: "Transfer failed. Please try again."
            });

        } finally {

            client.release();

        }

    }
);
// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Lagos Legends running on port ${PORT}`
    );

});
