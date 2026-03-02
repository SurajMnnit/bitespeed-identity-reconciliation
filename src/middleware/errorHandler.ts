/**
 * Global centralized error-handling middleware.
 * Returns structured error responses as required.
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface AppError extends Error {
    status?: number;
    message: string;
}

export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";

    // Log error in production format
    logger.error(message, {
        status,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });

    res.status(status).json({
        error: message,
        status: status
    });
}
