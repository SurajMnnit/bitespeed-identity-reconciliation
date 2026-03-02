/**
 * Express application configuration.
 * - Morgan logging
 * - Health monitoring
 * - Global middlewares
 */

import express from "express";
import cors from "cors";
import morgan from "morgan";
import { identifyRoutes } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

const app = express();

// ── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Morgan structured logging for requests
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(morganFormat, {
    stream: {
        write: (msg: string) => logger.info(msg.trim())
    }
}));

// ── Health Check (for Render monitoring) ───────────────────────────────────
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "OK" });
});

// Legacy root check
app.get("/", (_req, res) => {
    res.json({
        status: "healthy",
        service: "Bitespeed Identity Reconciliation",
        timestamp: new Date().toISOString(),
    });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use(identifyRoutes);

// ── Global Error Catch-all ───────────────────────────────────────────────────
app.use(errorHandler);

export default app;
