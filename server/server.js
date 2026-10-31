import express from "express";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.use(express.static(
    path.join(__dirname, "../public")
));

// DATABASE CONNECTION
const pool = process.env.DATABASE_URL
    ? new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 5
    })
    : null;

// SERVER HEALTH
app.get("/api/health", (req, res) => {
    res.json({
        status: "online",
        game: "Lagos Legends",
        message: "Game server is running."
    });
});
// NIGERIAN SERVER TIME
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
// DATABASE HEALTH
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

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lagos Legends running on port ${PORT}`);
});
