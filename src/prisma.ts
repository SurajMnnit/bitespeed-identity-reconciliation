/**
 * Prisma client singleton.
 *
 * Re-uses a single PrismaClient instance across the application to avoid
 * exhausting the database connection pool.
 *
 * In Prisma v7, PrismaClient is generated into .prisma/client
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
});

export default prisma;
