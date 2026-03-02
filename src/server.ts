/**
 * Server entry point.
 * Production-hardened with logging and graceful shutdown.
 */

import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

import app from "./app";
import prisma from "./prisma";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 3000;

async function main() {
    try {
        // Connect to database
        await prisma.$connect();
        logger.info("✅ Database connectivity verified");

        app.listen(PORT, () => {
            logger.info(`🚀 Bitespeed Identity API running on port ${PORT}`);
            logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`   Health endpoint: /health`);
        });
    } catch (error: any) {
        logger.error("❌ Failed to start server:", error.message);
        process.exit(1);
    }
}

// ── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
    logger.info(`\n🛑 Received ${signal}. Closing database...`);
    await prisma.$disconnect();
    process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main();
